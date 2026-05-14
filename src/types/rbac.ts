/* ──────────────────────────────────────────────────────────────────────
 * Client-facing RBAC alias.
 *
 * BelaBlaze runs two RBAC layers:
 *   1. Per-org (FASE 6) — OrgRole + Permission in src/lib/rbac.ts.
 *      Source of truth for tenant-scoped server checks.
 *   2. Global (this file) — coarse platform role tied to Clerk
 *      publicMetadata.role. Drives nav visibility, top-level guards,
 *      and the PermissionGate UI helper.
 *
 * The two coexist deliberately: server actions enforce per-org perms
 * via assertCan() from lib/rbac.ts; the UI hides what the global role
 * shouldn't see via PermissionGate from this file. Security is still
 * enforced on the server — the client gates are convenience only.
 * ────────────────────────────────────────────────────────────────────── */

import type { AccountType, OrgRole, UserRole } from "@/types";

export type Role = "super_admin" | "admin" | "staff" | "client" | "viewer";

export type Permission =
  | "users:read" | "users:write" | "users:delete" | "users:manage_roles"
  | "campaigns:read_own" | "campaigns:read_all" | "campaigns:create"
  | "campaigns:edit_own" | "campaigns:edit_all" | "campaigns:delete"
  | "campaigns:approve" | "campaigns:publish"
  | "screens:read" | "screens:write" | "screens:manage"
  | "analytics:read_own" | "analytics:read_all" | "analytics:export"
  | "ads:read_own" | "ads:read_all" | "ads:create" | "ads:edit_own" | "ads:edit_all" | "ads:delete"
  | "system:settings" | "system:billing" | "system:audit_log" | "system:notifications_admin"
  | "clients:read" | "clients:write" | "clients:delete";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    "users:read", "users:write", "users:delete", "users:manage_roles",
    "campaigns:read_own", "campaigns:read_all", "campaigns:create",
    "campaigns:edit_own", "campaigns:edit_all", "campaigns:delete",
    "campaigns:approve", "campaigns:publish",
    "screens:read", "screens:write", "screens:manage",
    "analytics:read_own", "analytics:read_all", "analytics:export",
    "ads:read_own", "ads:read_all", "ads:create", "ads:edit_own", "ads:edit_all", "ads:delete",
    "system:settings", "system:billing", "system:audit_log", "system:notifications_admin",
    "clients:read", "clients:write", "clients:delete",
  ],
  admin: [
    "users:read", "users:write", "users:manage_roles",
    "campaigns:read_all", "campaigns:create", "campaigns:edit_all", "campaigns:delete",
    "campaigns:approve", "campaigns:publish",
    "screens:read", "screens:write", "screens:manage",
    "analytics:read_all", "analytics:export",
    "ads:read_all", "ads:create", "ads:edit_all", "ads:delete",
    "system:settings",
    "clients:read", "clients:write",
  ],
  staff: [
    "campaigns:read_all", "campaigns:edit_all", "campaigns:approve",
    "screens:read", "screens:write",
    "analytics:read_all",
    "ads:read_all", "ads:edit_all",
    "clients:read",
  ],
  client: [
    "campaigns:read_own", "campaigns:create", "campaigns:edit_own",
    "analytics:read_own",
    "ads:read_own", "ads:create", "ads:edit_own",
  ],
  viewer: [
    "campaigns:read_own",
    "analytics:read_own",
    "ads:read_own",
  ],
};

/* ── Bidirectional mapping with the canonical Prisma enums ────────────
 * UserRole (global, from Clerk publicMetadata):
 *   ADMIN     → super_admin  (FASE 5 hardened-onboarding platform admin)
 *   EXECUTIVE → admin
 *   COMPANY   → client
 *   CREATOR   → client
 *   CLIENT    → viewer       (legacy)
 *
 * OrgRole (per-tenant, from OrganizationMember):
 *   OWNER     → super_admin within the org
 *   ADMIN     → admin
 *   EXECUTIVE → staff
 *   MANAGER   → staff
 *   EDITOR    → client
 *   ANALYST   → viewer
 *   VIEWER    → viewer
 * ──────────────────────────────────────────────────────────────────── */

export function fromUserRole(role: UserRole | null | undefined): Role {
  switch (role) {
    case "ADMIN": return "super_admin";
    case "EXECUTIVE": return "admin";
    case "COMPANY": return "client";
    case "CREATOR": return "client";
    case "CLIENT": return "viewer";
    default: return "viewer";
  }
}

export function fromOrgRole(role: OrgRole | null | undefined): Role {
  switch (role) {
    case "OWNER": return "super_admin";
    case "ADMIN": return "admin";
    case "EXECUTIVE": return "staff";
    case "MANAGER": return "staff";
    case "EDITOR": return "client";
    case "ANALYST": return "viewer";
    case "VIEWER": return "viewer";
    default: return "viewer";
  }
}

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  allowedRoles: Role[];
  /** When set, only these AccountTypes see the item in the sidebar.
   *  Use to keep enterprise/business-only surfaces away from creators. */
  allowedAccountTypes?: AccountType[];
  /** When true, only platform staff (BannerBlaze internal) see it. */
  platformOnly?: boolean;
  badge?: string;
  section?: string;
};

/* Visibility model
 * ---------------------------------------------------------------------
 * The sidebar combines four signals before rendering an item:
 *
 *   1. PlatformRole (src/lib/platform.ts) — SUPER_ADMIN bypasses all
 *      filters; SUPPORT sees everything that isn't strictly tenant-only
 *      data.
 *   2. AccountType — only items whose allowedAccountTypes set matches
 *      the user's account are shown. INTERNAL accounts see everything.
 *   3. Global Role (lowercase) — coarse-grain, legacy. Mostly used to
 *      hide management items from `viewer`.
 *   4. OrgRole + Plan feature flag — enforced inside each page via
 *      requireOrgContext + assertCan / assertHasFeature.
 *
 * IMPORTANT: NAV_ITEMS is the *display* layer. Server pages and actions
 * still own the real security checks. */
export const NAV_ITEMS: NavItem[] = [
  // ── Available to everyone (creator, business, internal, viewer) ──
  { section: "Principal", label: "Dashboard", href: "/dashboard", icon: "ti-layout-dashboard",
    allowedRoles: ["super_admin", "admin", "staff", "client", "viewer"] },
  { section: "Principal", label: "Campañas",  href: "/campaigns", icon: "ti-speakerphone",
    allowedRoles: ["super_admin", "admin", "staff", "client", "viewer"] },
  { section: "Principal", label: "Anuncios",  href: "/ads",       icon: "ti-photo",
    allowedRoles: ["super_admin", "admin", "staff", "client", "viewer"] },
  { section: "Principal", label: "Analytics", href: "/analytics", icon: "ti-chart-area-line",
    allowedRoles: ["super_admin", "admin", "staff", "client", "viewer"] },
  { section: "Principal", label: "Media",     href: "/media",     icon: "ti-photo-video",
    allowedRoles: ["super_admin", "admin", "staff", "client"] },

  // ── Business / enterprise surfaces (creators don't see) ──
  { section: "Principal", label: "Calendario",   href: "/campaigns/calendar", icon: "ti-calendar-event",
    allowedRoles: ["super_admin", "admin", "staff", "client"],
    allowedAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  { section: "Operaciones", label: "Pantallas",    href: "/screens",    icon: "ti-device-tv",
    allowedRoles: ["super_admin", "admin", "staff", "client", "viewer"],
    allowedAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  { section: "Operaciones", label: "Aprobaciones", href: "/approvals",  icon: "ti-checks",
    allowedRoles: ["super_admin", "admin", "staff", "client"],
    allowedAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  { section: "Operaciones", label: "Clientes",     href: "/clients",    icon: "ti-users",
    allowedRoles: ["super_admin", "admin", "staff", "client"],
    allowedAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  { section: "Admin", label: "Equipo",        href: "/settings/team",     icon: "ti-user-shield",
    allowedRoles: ["super_admin", "admin", "staff", "client"],
    allowedAccountTypes: ["ORGANIZATION", "INTERNAL"] },

  // ── Settings + billing — everyone (creators get a slimmer billing view) ──
  { section: "Admin", label: "Configuración", href: "/settings",          icon: "ti-settings",
    allowedRoles: ["super_admin", "admin", "staff", "client", "viewer"] },
  { section: "Admin", label: "Facturación",   href: "/settings/billing",  icon: "ti-credit-card",
    allowedRoles: ["super_admin", "admin", "staff", "client"] },

  // ── Audit log: ORGANIZATION + INTERNAL only (creators never see it) ──
  { section: "Admin", label: "Audit Log", href: "/settings/activity", icon: "ti-list-details",
    allowedRoles: ["super_admin", "admin", "staff", "client"],
    allowedAccountTypes: ["ORGANIZATION", "INTERNAL"] },
];

export type UserStatus = "active" | "inactive" | "suspended" | "pending";

export type BelaBlazeUser = {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  organizationId?: string;
  organizationName?: string;
  lastSeen?: Date;
  createdAt: Date;
  permissions?: Permission[];
};

export type SessionContext = {
  user: BelaBlazeUser;
  organizationId?: string;
  permissions: Permission[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isClient: boolean;
  isStaff: boolean;
};
