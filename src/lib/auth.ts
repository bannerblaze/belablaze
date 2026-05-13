import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { User as DbUser } from "@prisma/client";
import type { UserRole } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Centralized auth & role resolution
 *
 * Single source of truth for "who is this user and what can they do?".
 * Handles three real-world cases:
 *   1. Clerk webhook has run → Prisma row exists → use it
 *   2. Webhook hasn't fired (dev, missing secret) → lazily provision
 *      the Prisma row from Clerk data on first request
 *   3. Role isn't set anywhere → DEV fallback to ADMIN, PROD fallback
 *      to CLIENT (least privilege)
 *
 * Role precedence (highest first):
 *   1. Clerk publicMetadata.role  (set by admin via Clerk dashboard / API)
 *   2. Clerk unsafeMetadata.role  (user-writable — useful for dev)
 *   3. Prisma user.role           (DB source of truth)
 *   4. DEV fallback: "ADMIN"      (so local dev never gets blocked)
 *   5. PROD fallback: "CLIENT"    (least privilege)
 *
 * Drift sync: if precedence yields a role that differs from the DB row,
 * the DB row is updated to match. This keeps `requireRole()` checks
 * consistent regardless of where the role was originally set.
 * ────────────────────────────────────────────────────────────────────── */

const IS_DEV = process.env.NODE_ENV !== "production";

function devLog(...args: unknown[]): void {
  if (IS_DEV) console.log("[auth]", ...args);
}

/** Where the resolved role originally came from — for debug logs only. */
type RoleSource = "clerk-public" | "clerk-unsafe" | "db" | "dev-fallback" | "prod-fallback";

/** Minimal Clerk user shape we depend on. Avoids the heavy server type import. */
type ClerkLite = {
  id: string;
  primaryEmailAddress?: { emailAddress: string } | null;
  emailAddresses: Array<{ emailAddress: string }>;
  fullName: string | null;
  firstName: string | null;
  imageUrl: string;
  publicMetadata: unknown;
  unsafeMetadata: unknown;
};

const VALID_ROLES: ReadonlySet<UserRole> = new Set(["ADMIN", "EXECUTIVE", "COMPANY", "CREATOR", "CLIENT"]);

function asRole(v: unknown): UserRole | null {
  if (typeof v !== "string") return null;
  return VALID_ROLES.has(v as UserRole) ? (v as UserRole) : null;
}

function resolveRole(dbUser: DbUser | null, clerkUser: ClerkLite): { role: UserRole; source: RoleSource } {
  const publicRole = asRole((clerkUser.publicMetadata as { role?: unknown })?.role);
  if (publicRole) return { role: publicRole, source: "clerk-public" };

  const unsafeRole = asRole((clerkUser.unsafeMetadata as { role?: unknown })?.role);
  if (unsafeRole) return { role: unsafeRole, source: "clerk-unsafe" };

  // If the user has finished onboarding, trust the DB role (it's the source of truth).
  // If onboarding is NOT complete, never promote — let the onboarding flow assign the role.
  // This prevents the DEV fallback from bypassing the admin whitelist + access-code wizard.
  if (dbUser?.role && dbUser.onboardingCompleted) {
    return { role: dbUser.role as UserRole, source: "db" };
  }

  // DEV fallback only applies to fully-onboarded ADMIN sessions (manual dev override).
  // Pre-onboarding users always get CLIENT so the gate runs.
  if (IS_DEV && dbUser?.onboardingCompleted) {
    return { role: "ADMIN", source: "dev-fallback" };
  }

  return { role: dbUser?.role as UserRole | undefined ?? "CLIENT", source: dbUser ? "db" : "prod-fallback" };
}

/**
 * Lazily creates a Prisma User row for a Clerk user, or syncs the role if
 * drift is detected. Idempotent — safe to call on every request.
 */
async function ensureUserRecord(clerkUser: ClerkLite): Promise<DbUser> {
  const email = clerkUser.primaryEmailAddress?.emailAddress
    ?? clerkUser.emailAddresses[0]?.emailAddress
    ?? `${clerkUser.id}@no-email.local`;
  const name = clerkUser.fullName ?? clerkUser.firstName ?? email;

  const existing = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  const { role, source } = resolveRole(existing, clerkUser);

  if (!existing) {
    // New rows always start unfinished — onboarding flow assigns role + accountType.
    // `role` defaults to CLIENT regardless of resolveRole's output for non-onboarded users.
    devLog(`provisioning new user clerkId=${clerkUser.id} email=${email} (initial role=CLIENT, onboardingCompleted=false)`);
    return db.user.create({
      data: {
        clerkId: clerkUser.id,
        email,
        name,
        avatar: clerkUser.imageUrl || null,
        role: "CLIENT",
        onboardingCompleted: false,
        accountType: null,
      },
    });
  }

  // Sync drift between Clerk metadata and DB row — but ONLY for onboarded users.
  // Pre-onboarding rows are owned by the wizard; we never overwrite them here.
  if (existing.onboardingCompleted && existing.role !== role) {
    devLog(`role drift: db=${existing.role} → resolved=${role} (source=${source}) — updating DB`);
    return db.user.update({
      where: { id: existing.id },
      data: { role, name, avatar: clerkUser.imageUrl || existing.avatar },
    });
  }

  return existing;
}

export type AuthUser = DbUser;

/**
 * Lazily syncs the DB role into Clerk publicMetadata if it isn't already set.
 * This ensures the client-side `useRole()` hook reflects the correct role
 * even for users who completed onboarding before metadata sync was implemented.
 * Runs at most once per role/metadata combination — swallows Clerk API errors.
 */
async function syncMetadataIfNeeded(clerkUser: ClerkLite, dbUser: DbUser): Promise<void> {
  if (!dbUser.onboardingCompleted) return;
  const currentPublicRole = (clerkUser.publicMetadata as { role?: string })?.role;
  if (currentPublicRole === dbUser.role) return; // already in sync

  try {
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: { role: dbUser.role },
    });
    devLog(`synced Clerk publicMetadata.role → ${dbUser.role}`);
  } catch (err) {
    console.error("[auth] Clerk metadata sync failed (non-blocking):", err);
  }
}

/** Returns the merged Clerk+Prisma user, auto-provisioning if needed. Null when no session. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    devLog("getCurrentUser → no Clerk session");
    return null;
  }

  try {
    const user = await ensureUserRecord(clerkUser as unknown as ClerkLite);
    devLog(`getCurrentUser → ${user.email} role=${user.role}`);
    // Background sync: ensure Clerk publicMetadata matches DB role (non-blocking).
    // This runs once per role mismatch, then becomes a no-op on subsequent requests.
    syncMetadataIfNeeded(clerkUser as unknown as ClerkLite, user).catch(() => {});
    return user;
  } catch (err) {
    console.error("[auth] failed to resolve user record:", err);
    return null;
  }
}

/** Lightweight session-only check. Does NOT touch the DB. */
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/* ──────────────────────────────────────────────────────────────────────
 * Permission gates
 * ────────────────────────────────────────────────────────────────────── */

/** Typed auth error so server actions can surface a clean message to clients. */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly reason: "unauthenticated" | "forbidden",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Redirects to /sign-in if not authenticated. Returns the user otherwise. */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Throws AuthError if the user is not ADMIN. */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("No autenticado", "unauthenticated");
  if (user.role !== "ADMIN") {
    throw new AuthError("Sin permisos: se requiere rol ADMIN", "forbidden");
  }
  return user;
}

/** Throws AuthError if the user is not ADMIN or EXECUTIVE. */
export async function requireAdminOrExecutive(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("No autenticado", "unauthenticated");
  if (user.role !== "ADMIN" && user.role !== "EXECUTIVE") {
    throw new AuthError("Sin permisos para esta acción", "forbidden");
  }
  return user;
}

/** Soft check for server components — returns user + permission flags without throwing. */
export async function checkPermissions(): Promise<{
  user: AuthUser | null;
  isAdmin: boolean;
  isExecutive: boolean;
  isClient: boolean;
  canApprove: boolean;
  canManageScreens: boolean;
  canManageClients: boolean;
}> {
  const user = await getCurrentUser();
  const role = user?.role as UserRole | undefined;
  return {
    user,
    isAdmin: role === "ADMIN",
    isExecutive: role === "EXECUTIVE",
    isClient: role === "CLIENT",
    canApprove: role === "ADMIN" || role === "EXECUTIVE",
    canManageScreens: role === "ADMIN" || role === "EXECUTIVE",
    canManageClients: role === "ADMIN",
  };
}

/* ──────────────────────────────────────────────────────────────────────
 * Legacy compatibility shims — kept temporarily for existing callers.
 * Prefer the explicit helpers above in new code.
 * ────────────────────────────────────────────────────────────────────── */

/** @deprecated Use getCurrentUser() and read user.role. */
export async function getRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return (user?.role as UserRole | undefined) ?? null;
}

/** @deprecated Use requireAdmin / requireAdminOrExecutive. */
export async function requireRole(role: UserRole): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== role) redirect("/dashboard");
}

export type { UserRole } from "@/types";
