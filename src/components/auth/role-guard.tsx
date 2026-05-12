"use client";

import { useRole, UserRole } from "@/hooks/use-role";

interface RoleGuardProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders `children` only if the current user has one of the specified roles.
 * Shows `fallback` (default: nothing) otherwise.
 */
export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const role = useRole();
  if (!role || !roles.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}
