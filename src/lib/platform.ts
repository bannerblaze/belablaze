import { isAdminWhitelisted } from "@/config/admin-whitelist";
import type { AccountType } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * PlatformRole — the top axis of the BelaBlaze access model.
 *
 * BelaBlaze has TWO access axes (single-owner product):
 *
 *   1. PlatformRole  (this file)   — who you are to BannerBlaze itself.
 *      Decides: cross-tenant access, internal admin tooling.
 *
 *   2. AccountType   (DB column)   — what kind of customer surface you use.
 *      Decides: which sidebar items are even relevant
 *      (creator vs business vs internal staff).
 *
 * Per-org RBAC is gone — every user IS the owner of their own org, so
 * "what can this user do inside their org?" collapses to "everything".
 * Cross-tenant access lives in SUPER_ADMIN; internal-only operations
 * live behind isPlatformStaff (SUPER_ADMIN + SUPPORT).
 * ────────────────────────────────────────────────────────────────────── */

export type PlatformRole = "SUPER_ADMIN" | "SUPPORT" | "USER";

/** Subset of fields we need to derive PlatformRole. Keeps callers
 *  flexible — works with Prisma User rows, Clerk Lite objects, or
 *  hand-built test fixtures. */
export interface PlatformRoleInput {
  email: string;
  accountType?: AccountType | null;
}

/**
 * Resolves the platform role for a user.
 *
 *   SUPER_ADMIN  — email is in the admin whitelist
 *                  (admin@bannerblaze.com, ceo@bannerblaze.com, or
 *                  anything in ADMIN_WHITELIST_EMAILS env). These accounts
 *                  see every module, bypass accountType filters, can read
 *                  any org, and (in the future) impersonate.
 *
 *   SUPPORT      — accountType=INTERNAL but not in the whitelist.
 *                  BannerBlaze staff who can help customers but don't
 *                  get the keys to the kingdom.
 *
 *   USER         — everyone else (business / creator / legacy).
 */
export function getPlatformRole(input: PlatformRoleInput | null | undefined): PlatformRole {
  if (!input) return "USER";
  if (isAdminWhitelisted(input.email)) return "SUPER_ADMIN";
  if (input.accountType === "INTERNAL") return "SUPPORT";
  return "USER";
}

export function isPlatformAdmin(input: PlatformRoleInput | null | undefined): boolean {
  return getPlatformRole(input) === "SUPER_ADMIN";
}

/** True for SUPER_ADMIN + SUPPORT — anyone BannerBlaze-internal. */
export function isPlatformStaff(input: PlatformRoleInput | null | undefined): boolean {
  const r = getPlatformRole(input);
  return r === "SUPER_ADMIN" || r === "SUPPORT";
}
