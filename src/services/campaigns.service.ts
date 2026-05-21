import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { FilterOptions } from "@/types";
import { getOrgContext } from "@/lib/org-context";

/* ──────────────────────────────────────────────────────────────────────
 * Multi-tenant read service for Campaigns.
 *
 * Every query is scoped to the caller's active organization via
 * getOrgContext(). Returns [] when there is no session/org so the UI
 * shows an empty state instead of leaking cross-tenant data.
 * ────────────────────────────────────────────────────────────────────── */

export async function getCampaigns(filters: FilterOptions = {}) {
  try {
  const ctx = await getOrgContext();
  if (!ctx) return [];

  const where: Prisma.CampaignWhereInput = { organizationId: ctx.organizationId };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { client: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  if (filters.status && filters.status !== "all") {
    where.status = filters.status as Prisma.EnumCampaignStatusFilter;
  }

  if (filters.clientId) {
    where.clientId = filters.clientId;
  }

  const campaigns = await db.campaign.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, slug: true, industry: true } },
      _count: { select: { ads: true, screens: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 50,
    skip: filters.page ? (filters.page - 1) * (filters.limit ?? 50) : 0,
  });

  return campaigns.map((c) => ({
    ...c,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
  } catch {
    return [];
  }
}

export async function getCampaignById(id: string) {
  const ctx = await getOrgContext();
  if (!ctx) return null;

  const campaign = await db.campaign.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      client: true,
      ads: true,
      screens: { include: { screen: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!campaign) return null;

  return {
    ...campaign,
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate.toISOString(),
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}

export async function getCampaignMetrics() {
  const ctx = await getOrgContext();
  if (!ctx) return { total: 0, active: 0, totalBudget: 0, totalSpent: 0, totalImpressions: 0 };

  const campaigns = await db.campaign.findMany({
    where: { organizationId: ctx.organizationId },
    select: { status: true, budget: true, spent: true, impressions: true },
  });

  return {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "ACTIVE").length,
    totalBudget: campaigns.reduce((s, c) => s + c.budget, 0),
    totalSpent: campaigns.reduce((s, c) => s + c.spent, 0),
    totalImpressions: campaigns.reduce((s, c) => s + c.impressions, 0),
  };
}
