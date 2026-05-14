import type { PlanTier } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Plans — single source of truth for billing, limits and feature flags.
 *
 * This file is intentionally framework-free (no Prisma, no Clerk, no
 * "server-only") so it can be imported from client components, server
 * actions, route handlers, and the upcoming Stripe webhook handler
 * without bundling issues.
 *
 * Runtime enforcement (count queries, throw-on-overuse) lives in
 * src/lib/limits.ts which DOES depend on Prisma.
 * ────────────────────────────────────────────────────────────────────── */

export const PLAN_TIERS = ["FREE", "STARTER", "GROWTH", "ENTERPRISE"] as const;

export type PlanFeature =
  | "advancedAnalytics"   // breakdowns by city, top-campaigns, period compare
  | "analyticsExport"     // CSV / PDF export from /analytics
  | "apiKeys"             // /settings/api-keys
  | "webhooks"            // /settings/webhooks
  | "customBranding"      // /settings/branding logo + brand color
  | "ssoSaml"             // SSO / SAML (Enterprise only — UI not built yet)
  | "auditLog"            // /settings/activity
  | "auditExport"         // CSV export on the audit log
  | "multipleOrgs"        // OWNER can create more than one organization
  | "multiWorkspace"      // additional workspaces beyond "Producción"
  | "prioritySupport";    // marketing flag, no runtime effect

export interface PlanLimits {
  /** Active + draft campaigns combined */
  campaigns: number;
  /** Screens registered to the org */
  screens: number;
  /** OrganizationMembers (pending invites count toward this too) */
  members: number;
  /** Aggregate media storage in megabytes */
  storageMB: number;
  /** Distinct MediaAsset rows (non-archived) */
  mediaAssets: number;
  /** How many orgs the same user can OWN. 1 means "single org" */
  organizations: number;
}

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  tagline: string;
  /** USD per month. 0 = free tier. */
  priceMonthly: number;
  /** USD per month when billed annually (typically priceMonthly × 10) */
  priceYearly: number;
  limits: PlanLimits;
  features: Record<PlanFeature, boolean>;
  /** Marketing bullets shown on the upgrade card */
  highlights: string[];
  /** Mark "Popular" on the upgrade page */
  popular?: boolean;
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    tagline: "Para probar BelaBlaze sin compromiso",
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      campaigns: 1,
      screens: 2,
      members: 1,
      storageMB: 100,
      mediaAssets: 10,
      organizations: 1,
    },
    features: {
      advancedAnalytics: false,
      analyticsExport: false,
      apiKeys: false,
      webhooks: false,
      customBranding: false,
      ssoSaml: false,
      auditLog: false,
      auditExport: false,
      multipleOrgs: false,
      multiWorkspace: false,
      prioritySupport: false,
    },
    highlights: [
      "1 campaña activa",
      "2 pantallas",
      "100 MB de media",
      "Analytics básico",
    ],
  },
  STARTER: {
    tier: "STARTER",
    name: "Starter",
    tagline: "Para creadores y marcas que arrancan",
    priceMonthly: 49,
    priceYearly: 490,
    limits: {
      campaigns: 5,
      screens: 10,
      members: 3,
      storageMB: 500,
      mediaAssets: 100,
      organizations: 3,
    },
    features: {
      advancedAnalytics: false,
      analyticsExport: false,
      apiKeys: false,
      webhooks: false,
      customBranding: false,
      ssoSaml: false,
      auditLog: true,
      auditExport: false,
      multipleOrgs: true,
      multiWorkspace: false,
      prioritySupport: false,
    },
    highlights: [
      "5 campañas activas",
      "10 pantallas",
      "3 miembros",
      "500 MB de media",
      "Audit log básico",
      "Soporte por email",
    ],
  },
  GROWTH: {
    tier: "GROWTH",
    name: "Growth",
    tagline: "Para equipos en escala con más capacidad",
    priceMonthly: 199,
    priceYearly: 1990,
    limits: {
      campaigns: 50,
      screens: 100,
      members: 15,
      storageMB: 10_000,
      mediaAssets: 2_000,
      organizations: 10,
    },
    features: {
      advancedAnalytics: true,
      analyticsExport: true,
      apiKeys: true,
      webhooks: true,
      customBranding: false,
      ssoSaml: false,
      auditLog: true,
      auditExport: true,
      multipleOrgs: true,
      multiWorkspace: false,
      prioritySupport: true,
    },
    highlights: [
      "50 campañas activas",
      "100 pantallas",
      "15 miembros",
      "10 GB de media",
      "Analytics avanzado + export",
      "Webhooks + API keys",
      "Soporte prioritario",
    ],
    popular: true,
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    name: "Enterprise",
    tagline: "SLAs, SSO y soporte dedicado",
    priceMonthly: 999,
    priceYearly: 9990,
    limits: {
      campaigns: 9999,
      screens: 9999,
      members: 999,
      storageMB: 100_000,
      mediaAssets: 50_000,
      organizations: 999,
    },
    features: {
      advancedAnalytics: true,
      analyticsExport: true,
      apiKeys: true,
      webhooks: true,
      customBranding: true,
      ssoSaml: true,
      auditLog: true,
      auditExport: true,
      multipleOrgs: true,
      multiWorkspace: true,
      prioritySupport: true,
    },
    highlights: [
      "Capacidad ilimitada",
      "Multi-workspace",
      "Custom branding",
      "SSO / SAML",
      "Audit logs avanzados",
      "SLA 99.9%",
      "Customer Success Manager",
    ],
  },
};

/* Backwards-compat aliases used elsewhere in the codebase. Derived from
 * PLANS so the source of truth stays in one place. */
export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = Object.fromEntries(
  PLAN_TIERS.map((t) => [t, PLANS[t].limits]),
) as Record<PlanTier, PlanLimits>;

export const PLAN_DETAILS: Record<PlanTier, {
  name: string;
  tagline: string;
  priceMonthly: number;
  features: string[];
}> = Object.fromEntries(
  PLAN_TIERS.map((t) => [t, {
    name: PLANS[t].name,
    tagline: PLANS[t].tagline,
    priceMonthly: PLANS[t].priceMonthly,
    features: PLANS[t].highlights,
  }]),
) as Record<PlanTier, { name: string; tagline: string; priceMonthly: number; features: string[] }>;

/* ── Helpers ─────────────────────────────────────────────────────── */

export function getPlan(tier: PlanTier | null | undefined): PlanDefinition {
  return PLANS[tier ?? "FREE"];
}

export function hasFeature(tier: PlanTier | null | undefined, feature: PlanFeature): boolean {
  return getPlan(tier).features[feature] === true;
}

export function getLimit(tier: PlanTier | null | undefined, resource: keyof PlanLimits): number {
  return getPlan(tier).limits[resource];
}

/** True when `used` reaches or exceeds the limit. Treats >= 9999 as unlimited. */
export function isAtLimit(tier: PlanTier | null | undefined, resource: keyof PlanLimits, used: number): boolean {
  const max = getLimit(tier, resource);
  if (max >= 9999) return false;
  return used >= max;
}

export function tierRank(tier: PlanTier | null | undefined): number {
  switch (tier) {
    case "ENTERPRISE": return 3;
    case "GROWTH": return 2;
    case "STARTER": return 1;
    default: return 0;
  }
}

/** True when `tier` is at least `minimum` (Growth ≥ Starter, Enterprise ≥ Growth, …). */
export function isAtLeastTier(tier: PlanTier | null | undefined, minimum: PlanTier): boolean {
  return tierRank(tier) >= tierRank(minimum);
}

/** Suggest the next paid tier above the caller. Returns null when at top. */
export function nextTierAbove(tier: PlanTier | null | undefined): PlanTier | null {
  const idx = PLAN_TIERS.indexOf((tier ?? "FREE") as PlanTier);
  return idx >= 0 && idx < PLAN_TIERS.length - 1 ? PLAN_TIERS[idx + 1] : null;
}
