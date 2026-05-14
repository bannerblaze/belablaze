"use client";

import { type ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission, Role } from "@/types/rbac";

type PermissionGateProps = {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGate({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { canAny, canAll } = usePermissions();
  const all = permission ? [permission, ...permissions] : permissions;
  if (all.length === 0) return <>{children}</>;
  return (requireAll ? canAll(all) : canAny(all)) ? <>{children}</> : <>{fallback}</>;
}

export function RoleGate({
  roles,
  fallback = null,
  children,
}: {
  roles: Role | Role[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { hasRole } = usePermissions();
  return hasRole(roles) ? <>{children}</> : <>{fallback}</>;
}

export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate roles={["admin", "super_admin"]} fallback={fallback}>{children}</RoleGate>;
}

export function SuperAdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate roles="super_admin" fallback={fallback}>{children}</RoleGate>;
}

export function StaffAndAbove({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate roles={["staff", "admin", "super_admin"]} fallback={fallback}>{children}</RoleGate>;
}
