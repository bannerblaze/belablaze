/* ──────────────────────────────────────────────────────────────────────
 * Sidebar nav config + legacy global-role shims.
 *
 * BelaBlaze is single-owner: 1 user = 1 organization, no members, no
 * invitations, no per-org roles. The complex Role/Permission matrix
 * that used to live here is gone — the only access axes that matter are:
 *
 *   1. PlatformRole (src/lib/platform.ts) — SUPER_ADMIN | SUPPORT | USER
 *   2. AccountType  (Prisma)              — ORGANIZATION | PERSON | INTERNAL
 *
 * NAV_ITEMS only filters by those two now. Items can declare:
 *   • allowedAccountTypes → hide from creators / non-matching surfaces
 *   • platformOnly        → hide from external customers entirely
 *
 * The `Role` enum + `usePermissions` plumbing further down are legacy
 * shims kept alive purely so the user-menu / sidebar avatar can render
 * a human label ("Administrador" / "Empresa" / "Creator"). Nothing
 * gates real access on it anymore.
 * ────────────────────────────────────────────────────────────────────── */

import type { AccountType, UserRole } from "@/types";

export type Role = "super_admin" | "admin" | "client" | "viewer";

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

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  /** When set, only these AccountTypes see the item in the sidebar. */
  allowedAccountTypes?: AccountType[];
  /** When true, only platform staff (BannerBlaze internal) see it. */
  platformOnly?: boolean;
  badge?: string;
  section?: string;
};

/* Visibility = (no AccountType restriction OR account matches)
 *            AND (not platformOnly OR user is platform staff).
 *
 * Platform admins (admin@bannerblaze.com etc.) bypass every filter so
 * they can navigate any tenant's UI during support work. */
export const NAV_ITEMS: NavItem[] = [
  // Available to everyone (creator, business, internal)
  { section: "Principal", label: "Dashboard", href: "/dashboard", icon: "ti-layout-dashboard" },
  { section: "Principal", label: "Campañas",  href: "/campaigns", icon: "ti-speakerphone" },
  { section: "Principal", label: "Anuncios",  href: "/ads",       icon: "ti-photo" },
  { section: "Principal", label: "Analytics", href: "/analytics", icon: "ti-chart-area-line" },
  { section: "Principal", label: "Media",     href: "/media",     icon: "ti-photo-video" },

  // Business / enterprise surfaces (creators don't see)
  { section: "Principal", label: "Calendario",   href: "/campaigns/calendar", icon: "ti-calendar-event",
    allowedAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  { section: "Operaciones", label: "Aprobaciones", href: "/approvals",  icon: "ti-checks",
    allowedAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  // BannerBlaze-internal operations panels
  { section: "Operaciones", label: "Pantallas", href: "/screens", icon: "ti-device-tv",
    platformOnly: true },
  { section: "Operaciones", label: "Cuentas",   href: "/clients", icon: "ti-users",
    platformOnly: true },

  // Settings + billing — everyone (creators get a slimmer billing view)
  { section: "Admin", label: "Configuración", href: "/settings",          icon: "ti-settings" },
  { section: "Admin", label: "Facturación",   href: "/settings/billing",  icon: "ti-credit-card" },

  // Audit log: ORGANIZATION + INTERNAL only (creators never see it)
  { section: "Admin", label: "Audit Log", href: "/settings/activity", icon: "ti-list-details",
    allowedAccountTypes: ["ORGANIZATION", "INTERNAL"] },
];

export type UserStatus = "active" | "inactive" | "suspended" | "pending";
