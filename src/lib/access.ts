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
 *
 * Per-org RBAC is gone — every authenticated user IS the owner of
 * their own org, so "can this user do X in this org?" is always true.
 * What you see is decided by AccountType + PlatformRole only.
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

/** Throws if the caller is not BannerBlaze-internal (SUPER_ADMIN or
 *  SUPPORT). Use for internal operational modules — Pantallas DOOH,
 *  device telemetry, fleet ops — where ORGANIZATION/PERSON accounts
 *  must never reach the action even by guessing the URL. */
export async function requirePlatformStaff(): Promise<void> {
  const me = await getCurrentUser();
  if (!isPlatformStaff(me)) {
    throw new AccessError("Acceso reservado a personal de BannerBlaze", "platform_only");
  }
}

/** Soft variant for server components / pages. Returns the redirect
 *  target when the caller isn't platform staff, or null when they are.
 *  Mirrors checkAccountTypeAccess() so pages can early-return uniformly:
 *
 *      const blocked = await checkPlatformStaffAccess();
 *      if (blocked) redirect(blocked);
 */
export async function checkPlatformStaffAccess(
  fallback = "/dashboard",
): Promise<string | null> {
  const me = await getCurrentUser();
  if (!me) return "/sign-in";
  if (isPlatformStaff(me)) return null;
  return fallback;
}

/** Boolean form for callsites that branch (services that return [] vs
 *  throwing). Pure read — no exception machinery. */
export async function isPlatformStaffSession(): Promise<boolean> {
  const me = await getCurrentUser();
  return isPlatformStaff(me);
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
