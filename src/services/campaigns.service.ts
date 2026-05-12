import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import type { FilterOptions } from "@/types";

export async function getCampaigns(filters: FilterOptions = {}) {
  const { userId } = await auth();
  if (!userId) return [];

  const dbUser = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, role: true, companyId: true } });
  if (!dbUser) return [];

  const where: Prisma.CampaignWhereInput = {};

  if (dbUser.role === "CLIENT" && dbUser.companyId) {
    where.clientId = dbUser.companyId;
  } else if (dbUser.role === "EXECUTIVE") {
    where.userId = dbUser.id;
  }

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
}

export async function getCampaignById(id: string) {
  const campaign = await db.campaign.findUnique({
    where: { id },
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
  const campaigns = await db.campaign.findMany({
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
