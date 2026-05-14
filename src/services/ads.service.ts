import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { FilterOptions } from "@/types";
import { getOrgContext } from "@/lib/org-context";

/* ──────────────────────────────────────────────────────────────────────
 * Multi-tenant read service for Ads.
 *
 * All queries are scoped to the caller's active org via getOrgContext().
 * Ads are linked to campaigns which carry organizationId, so we scope
 * through `campaign.organizationId` rather than the Ad row directly.
 * ────────────────────────────────────────────────────────────────────── */

export async function getAds(filters: FilterOptions = {}) {
  const ctx = await getOrgContext();
  if (!ctx) return [];

  const where: Prisma.AdWhereInput = {
    campaign: { organizationId: ctx.organizationId },
  };

  if (filters.status && filters.status !== "all") {
    where.status = filters.status as Prisma.EnumAdStatusFilter;
  }

  if (filters.search) {
    where.title = { contains: filters.search, mode: "insensitive" };
  }

  const ads = await db.ad.findMany({
    where,
    include: {
      campaign: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 50,
  });

  return ads.map((a) => ({
    ...a,
    startDate: a.startDate?.toISOString() ?? null,
    endDate: a.endDate?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));
}

export async function getAdsPendingReview() {
  const ctx = await getOrgContext();
  if (!ctx) return [];

  const ads = await db.ad.findMany({
    where: { status: "PENDING_REVIEW", campaign: { organizationId: ctx.organizationId } },
    include: {
      campaign: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return ads.map((a) => ({
    ...a,
    startDate: a.startDate?.toISOString() ?? null,
    endDate: a.endDate?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));
}

export async function getAdsForApprovals() {
  const ctx = await getOrgContext();
  if (!ctx) return { pending: [], approved: [], rejected: [] };

  const scope: Prisma.AdWhereInput = { campaign: { organizationId: ctx.organizationId } };

  const [pending, approved, rejected] = await Promise.all([
    db.ad.findMany({
      where: { ...scope, status: "PENDING_REVIEW" },
      include: { campaign: { include: { client: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    db.ad.findMany({
      where: { ...scope, status: { in: ["APPROVED", "ACTIVE"] } },
      include: { campaign: { include: { client: { select: { id: true, name: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.ad.findMany({
      where: { ...scope, status: "REJECTED" },
      include: { campaign: { include: { client: { select: { id: true, name: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  const serialize = (a: typeof pending[0]) => ({
    ...a,
    startDate: a.startDate?.toISOString() ?? null,
    endDate: a.endDate?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  });

  return {
    pending: pending.map(serialize),
    approved: approved.map(serialize),
    rejected: rejected.map(serialize),
  };
}
