import type { OrgRole } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Enterprise RBAC — single source of truth for org-scoped permissions.
 *
 * Layered model:
 *   • OrgRole   → discrete role on a given Organization (OWNER … VIEWER)
 *   • Permission → atomic capability checked by server actions/pages
 *   • ROLE_MATRIX → maps role → permission[]
 *
 * Convention: every "can*" function is pure and synchronous. Server-side
 * gates (in actions / layouts) call `assertCan()` for a hard throw, or
 * the matching `canX()` for a soft boolean used in UI.
 *
 * Permissions are over-granted upward (OWNER ⊇ ADMIN ⊇ EXECUTIVE ⊇ …)
 * but each role list is explicit to make audit reviews trivial.
 * ────────────────────────────────────────────────────────────────────── */

export type Permission =
  | "org:view"
  | "org:update"
  | "org:delete"
  | "members:view"
  | "members:invite"
  | "members:update_role"
  | "members:remove"
  | "billing:view"
  | "billing:manage"
  | "campaigns:view"
  | "campaigns:create"
  | "campaigns:update"
  | "campaigns:delete"
  | "campaigns:schedule"
  | "ads:view"
  | "ads:create"
  | "ads:update"
  | "ads:delete"
  | "ads:approve"
  | "screens:view"
  | "screens:create"
  | "screens:update"
  | "screens:delete"
  | "clients:view"
  | "clients:manage"
  | "media:view"
  | "media:upload"
  | "media:delete"
  | "analytics:view"
  | "analytics:export"
  | "audit:view"
  | "apikeys:manage"
  | "webhooks:manage"
  | "settings:update";

const ALL: Permission[] = [
  "org:view", "org:update", "org:delete",
  "members:view", "members:invite", "members:update_role", "members:remove",
  "billing:view", "billing:manage",
  "campaigns:view", "campaigns:create", "campaigns:update", "campaigns:delete", "campaigns:schedule",
  "ads:view", "ads:create", "ads:update", "ads:delete", "ads:approve",
  "screens:view", "screens:create", "screens:update", "screens:delete",
  "clients:view", "clients:manage",
  "media:view", "media:upload", "media:delete",
  "analytics:view", "analytics:export",
  "audit:view", "apikeys:manage", "webhooks:manage", "settings:update",
];

export const ROLE_MATRIX: Record<OrgRole, ReadonlySet<Permission>> = {
  OWNER: new Set(ALL),
  ADMIN: new Set<Permission>([
    "org:view", "org:update",
    "members:view", "members:invite", "members:update_role", "members:remove",
    "billing:view",
    "campaigns:view", "campaigns:create", "campaigns:update", "campaigns:delete", "campaigns:schedule",
    "ads:view", "ads:create", "ads:update", "ads:delete", "ads:approve",
    "screens:view", "screens:create", "screens:update", "screens:delete",
    "clients:view", "clients:manage",
    "media:view", "media:upload", "media:delete",
    "analytics:view", "analytics:export",
    "audit:view", "apikeys:manage", "webhooks:manage", "settings:update",
  ]),
  EXECUTIVE: new Set<Permission>([
    "org:view", "members:view",
    "campaigns:view", "campaigns:create", "campaigns:update", "campaigns:schedule",
    "ads:view", "ads:create", "ads:update", "ads:approve",
    "screens:view", "screens:update",
    "clients:view",
    "media:view", "media:upload",
    "analytics:view", "analytics:export",
    "audit:view",
  ]),
  MANAGER: new Set<Permission>([
    "org:view", "members:view",
    "campaigns:view", "campaigns:create", "campaigns:update", "campaigns:schedule",
    "ads:view", "ads:create", "ads:update",
    "screens:view",
    "clients:view",
    "media:view", "media:upload",
    "analytics:view",
  ]),
  EDITOR: new Set<Permission>([
    "org:view",
    "campaigns:view", "campaigns:create", "campaigns:update",
    "ads:view", "ads:create", "ads:update",
    "screens:view",
    "media:view", "media:upload",
    "analytics:view",
  ]),
  ANALYST: new Set<Permission>([
    "org:view",
    "campaigns:view", "ads:view", "screens:view", "clients:view",
    "media:view", "analytics:view", "analytics:export",
  ]),
  VIEWER: new Set<Permission>([
    "org:view",
    "campaigns:view", "ads:view", "screens:view",
    "media:view", "analytics:view",
  ]),
};

export function can(role: OrgRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_MATRIX[role].has(permission);
}

export function canAny(role: OrgRole | null | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some((p) => ROLE_MATRIX[role].has(p));
}

export function canAll(role: OrgRole | null | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every((p) => ROLE_MATRIX[role].has(p));
}

export class PermissionError extends Error {
  constructor(public readonly permission: Permission, public readonly role: OrgRole | null) {
    super(`Permission denied: ${permission} (role=${role ?? "none"})`);
    this.name = "PermissionError";
  }
}

/** Hard guard used by server actions — throws PermissionError when not allowed. */
export function assertCan(role: OrgRole | null | undefined, permission: Permission): void {
  if (!can(role, permission)) throw new PermissionError(permission, role ?? null);
}

/* Pretty labels for UI rendering — kept in sync with sidebar/user-menu. */
export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  EXECUTIVE: "Ejecutivo",
  MANAGER: "Manager",
  EDITOR: "Editor",
  ANALYST: "Analista",
  VIEWER: "Lector",
};

export const ORG_ROLE_COLORS: Record<OrgRole, string> = {
  OWNER: "from-[#B8EB23]/20 to-[#8FB31E]/10 text-[#B8EB23] border-[#B8EB23]/30",
  ADMIN: "from-[#B8EB23]/15 to-[#B8EB23]/5 text-[#B8EB23] border-[#B8EB23]/20",
  EXECUTIVE: "from-blue-400/15 to-blue-500/5 text-blue-300 border-blue-400/25",
  MANAGER: "from-violet-400/15 to-violet-500/5 text-violet-300 border-violet-400/25",
  EDITOR: "from-amber-400/15 to-amber-500/5 text-amber-300 border-amber-400/25",
  ANALYST: "from-cyan-400/15 to-cyan-500/5 text-cyan-300 border-cyan-400/25",
  VIEWER: "from-white/8 to-white/[0.02] text-white/60 border-white/10",
};

export function isElevatedRole(role: OrgRole | null | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}
