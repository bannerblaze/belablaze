"use client";

import { useUser } from "@clerk/nextjs";

export type UserRole = "admin" | "ejecutivo" | "cliente";

/** Returns the current user's role from Clerk publicMetadata. */
export function useRole(): UserRole | null {
  const { user } = useUser();
  return ((user?.publicMetadata as { role?: UserRole })?.role) ?? null;
}

/** Returns true if the current user has at least one of the specified roles. */
export function useHasRole(...roles: UserRole[]): boolean {
  const role = useRole();
  if (!role) return false;
  return roles.includes(role);
}

/** Returns true only if the current user is an admin. */
export function useIsAdmin(): boolean {
  return useHasRole("admin");
}
