"use client";

import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";
import {
  ROLE_PERMISSIONS, fromUserRole,
  type Role, type Permission, type SessionContext, type BelaBlazeUser,
} from "@/types/rbac";
import type { UserRole } from "@/types";

const IS_DEV = process.env.NODE_ENV !== "production";

/* Resolves the user's global Role from Clerk metadata. Accepts either
 * the new lowercase format ("admin") or the legacy UPPERCASE UserRole
 * ("ADMIN") so existing accounts keep working without a migration. */
function resolveRole(user: ReturnType<typeof useUser>["user"]): Role {
  if (!user) return "viewer";
  const raw = (user.publicMetadata as { role?: string } | undefined)?.role
    ?? (user.unsafeMetadata as { role?: string } | undefined)?.role;

  if (raw && /^(super_admin|admin|staff|client|viewer)$/.test(raw)) {
    return raw as Role;
  }
  if (raw) {
    return fromUserRole(raw.toUpperCase() as UserRole);
  }
  // Match server-side DEV fallback in src/lib/auth.ts → ADMIN
  return IS_DEV ? "super_admin" : "viewer";
}

type PermissionsApi = SessionContext & {
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  hasRole: (role: Role | Role[]) => boolean;
};

export function usePermissions(): PermissionsApi {
  const { user } = useUser();

  return useMemo(() => {
    const role = resolveRole(user);
    const basePermissions = ROLE_PERMISSIONS[role] ?? [];
    const extraRaw = (user?.publicMetadata as { extraPermissions?: Permission[] } | undefined)?.extraPermissions ?? [];
    const permissions: Permission[] = Array.from(new Set<Permission>([...basePermissions, ...extraRaw]));

    const belaUser: BelaBlazeUser = {
      id: user?.id ?? "",
      clerkId: user?.id ?? "",
      name: user?.fullName ?? user?.firstName ?? "Usuario",
      email: user?.primaryEmailAddress?.emailAddress ?? "",
      role,
      status: "active",
      createdAt: user?.createdAt ? new Date(user.createdAt) : new Date(),
      permissions,
    };

    const ctx: SessionContext = {
      user: belaUser,
      permissions,
      isAdmin: role === "admin" || role === "super_admin",
      isSuperAdmin: role === "super_admin",
      isClient: role === "client",
      isStaff: role === "staff",
    };

    const permSet = new Set(permissions);
    return {
      ...ctx,
      can: (p) => permSet.has(p),
      canAny: (ps) => ps.some((p) => permSet.has(p)),
      canAll: (ps) => ps.every((p) => permSet.has(p)),
      hasRole: (r) => Array.isArray(r) ? r.includes(role) : role === r,
    };
  }, [user]);
}
