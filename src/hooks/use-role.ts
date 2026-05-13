"use client";

import { useUser } from "@clerk/nextjs";
import type { UserRole } from "@/types";

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Client-side role resolution. Mirrors server-side `resolveRole()` for the
 * subset of sources available in the browser (Clerk metadata). The DB role
 * isn't accessible client-side, so we trust Clerk metadata + dev fallback.
 *
 * Priority:
 *   1. publicMetadata.role
 *   2. unsafeMetadata.role
 *   3. DEV → "ADMIN" (matches server fallback so navigation is consistent)
 *   4. PROD → null (gated UI elements stay hidden)
 */
export function useRole(): UserRole | null {
  const { user, isLoaded } = useUser();
  if (!isLoaded || !user) return null;

  const publicRole = (user.publicMetadata as { role?: UserRole })?.role;
  if (publicRole) return publicRole;

  const unsafeRole = (user.unsafeMetadata as { role?: UserRole })?.role;
  if (unsafeRole) return unsafeRole;

  if (IS_DEV) return "ADMIN";
  return null;
}

/** Returns true when the current user matches one of the given roles. */
export function useHasRole(...roles: UserRole[]): boolean {
  const role = useRole();
  if (!role) return false;
  return roles.includes(role);
}

/** Convenience: is the current user an ADMIN? */
export function useIsAdmin(): boolean {
  return useHasRole("ADMIN");
}

/** Convenience: can the current user approve ads (ADMIN or EXECUTIVE)? */
export function useIsAdminOrExecutive(): boolean {
  return useHasRole("ADMIN", "EXECUTIVE");
}

export type { UserRole } from "@/types";
