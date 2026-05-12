import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import type { FilterOptions } from "@/types";

export async function getAds(filters: FilterOptions = {}) {
  const { userId } = await auth();
  if (!userId) return [];

  const dbUser = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, role: true, companyId: true } });
  if (!dbUser) return [];

  const where: Prisma.AdWhereInput = {};

  if (dbUser.role === "CLIENT" && dbUser.companyId) {
    where.campaign = { clientId: dbUser.companyId };
  }

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
  const ads = await db.ad.findMany({
    where: { status: "PENDING_REVIEW" },
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
  const [pending, approved, rejected] = await Promise.all([
    db.ad.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { campaign: { include: { client: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    db.ad.findMany({
      where: { status: { in: ["APPROVED", "ACTIVE"] } },
      include: { campaign: { include: { client: { select: { id: true, name: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.ad.findMany({
      where: { status: "REJECTED" },
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
