import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { isPlatformAdmin, isPlatformStaff, type PlatformRole, getPlatformRole } from "@/lib/platform";
import type { AccountType } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Access control — three-axis model.
 *
 *   1. PlatformRole  — SUPER_ADMIN bypasses every check. SUPPORT is
 *                      BannerBlaze-internal but not god-mode.
 *   2. AccountType   — ORGANIZATION (full surface), PERSON (creator —
 *                      no Pantallas/Aprobaciones/Clientes/Equipo/
 *                      Audit/API Keys/Webhooks/Branding), INTERNAL
 *                      (BannerBlaze staff).
 *   3. OrgRole       — what the user can do *inside* their org. Lives
 *                      in src/lib/rbac.ts and is enforced via
 *                      assertCan() inside actions and pages.
 *
 * No PlanTier, no per-plan feature flags. The product is one product;
 * what you can do depends on what kind of account you are and what
 * role you have in your org.
 * ────────────────────────────────────────────────────────────────────── */

/** Returns the redirect target a server component should send the
 *  user to when their accountType isn't in the allowed set, or null
 *  when access is granted. SUPER_ADMIN always passes. */
export async function checkAccountTypeAccess(
  allowed: AccountType[],
  fallback = "/dashboard",
): Promise<string | null> {
  const me = await getCurrentUser();
  if (isPlatformAdmin(me)) return null;
  if (!me?.accountType) return "/onboarding";
  if (allowed.includes(me.accountType)) return null;
  return fallback;
}

export class AccessError extends Error {
  constructor(message: string, public readonly reason: "no_session" | "account_type" | "platform_only") {
    super(message);
    this.name = "AccessError";
  }
}

/** Throwing variant — for server actions where redirect() is awkward. */
export async function requireAccountType(allowed: AccountType[]): Promise<void> {
  const me = await getCurrentUser();
  if (isPlatformAdmin(me)) return;
  if (!me) throw new AccessError("No autenticado", "no_session");
  if (!me.accountType || !allowed.includes(me.accountType)) {
    throw new AccessError(
      `Tu tipo de cuenta no permite esta acción.`,
      "account_type",
    );
  }
}

/** Throws if the caller isn't a platform super admin. Use for any
 *  cross-tenant tooling under /admin/* (when we build it). */
export async function requirePlatformAdmin(): Promise<void> {
  const me = await getCurrentUser();
  if (!isPlatformAdmin(me)) {
    throw new AccessError("Sólo super-administradores", "platform_only");
  }
}

/** Resolves the full access context in one query — for layouts that
 *  need to make several decisions at once (sidebar, settings shell). */
export async function getAccessContext(): Promise<{
  accountType: AccountType | null;
  platformRole: PlatformRole;
  isPlatformAdmin: boolean;
  isPlatformStaff: boolean;
}> {
  const user = await getCurrentUser();
  return {
    accountType: user?.accountType ?? null,
    platformRole: getPlatformRole(user),
    isPlatformAdmin: isPlatformAdmin(user),
    isPlatformStaff: isPlatformStaff(user),
  };
}
