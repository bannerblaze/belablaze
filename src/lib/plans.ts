import type { PlanTier, PlanLimits } from "@/types";

/* Plan + limits constants, kept outside the "use server" action files
 * since those can only export async functions. Both client and server
 * code may safely import from here. */

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  STARTER: { campaigns: 5, screens: 10, members: 3, storageMB: 500, mediaAssets: 100 },
  GROWTH: { campaigns: 50, screens: 100, members: 15, storageMB: 10_000, mediaAssets: 2_000 },
  ENTERPRISE: { campaigns: 9999, screens: 9999, members: 999, storageMB: 100_000, mediaAssets: 50_000 },
};

export const PLAN_DETAILS: Record<PlanTier, {
  name: string;
  tagline: string;
  priceMonthly: number;
  features: string[];
}> = {
  STARTER: {
    name: "Starter",
    tagline: "Para creadores y pequeñas marcas que arrancan",
    priceMonthly: 0,
    features: [
      "5 campañas activas",
      "10 pantallas",
      "3 miembros",
      "500 MB de media",
      "Analytics básico",
      "Soporte por email",
    ],
  },
  GROWTH: {
    name: "Growth",
    tagline: "Para equipos en escala que necesitan más capacidad",
    priceMonthly: 199,
    features: [
      "50 campañas activas",
      "100 pantallas",
      "15 miembros",
      "10 GB de media",
      "Analytics avanzado + export",
      "Aprobaciones multi-stage",
      "Webhooks + API keys",
      "Soporte prioritario",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    tagline: "SLAs, SSO y soporte dedicado",
    priceMonthly: 999,
    features: [
      "Ilimitado",
      "Multi-workspace",
      "Custom branding",
      "SSO / SAML",
      "Audit logs avanzados",
      "SLA 99.9%",
      "Customer Success Manager",
    ],
  },
};
