import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { FilterOptions } from "@/types";
import { getOrgContext } from "@/lib/org-context";

/* All screen queries scope by active organization. */

export async function getScreens(filters: FilterOptions = {}) {
  const ctx = await getOrgContext();
  if (!ctx) return [];

  const where: Prisma.ScreenWhereInput = { organizationId: ctx.organizationId };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { city: { contains: filters.search, mode: "insensitive" } },
      { address: { contains: filters.search, mode: "insensitive" } },
      { code: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.status && filters.status !== "all") {
    where.status = filters.status as Prisma.EnumScreenStatusFilter;
  }

  if (filters.city) {
    where.city = { contains: filters.city, mode: "insensitive" };
  }

  const screens = await db.screen.findMany({
    where,
    orderBy: [{ status: "asc" }, { city: "asc" }, { name: "asc" }],
    take: filters.limit ?? 100,
    skip: filters.page ? (filters.page - 1) * (filters.limit ?? 100) : 0,
  });

  return screens.map((s) => ({
    ...s,
    lastPingAt: s.lastPingAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
}

export async function getScreenById(id: string) {
  const ctx = await getOrgContext();
  if (!ctx) return null;

  const screen = await db.screen.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      adSchedules: {
        where: { isActive: true },
        include: { ad: { select: { id: true, title: true, status: true } } },
      },
    },
  });

  if (!screen) return null;

  return {
    ...screen,
    lastPingAt: screen.lastPingAt?.toISOString() ?? null,
    createdAt: screen.createdAt.toISOString(),
    updatedAt: screen.updatedAt.toISOString(),
  };
}

export async function getScreenMetrics() {
  const ctx = await getOrgContext();
  if (!ctx) return { total: 0, online: 0, offline: 0, maintenance: 0 };

  const screens = await db.screen.findMany({
    where: { organizationId: ctx.organizationId },
    select: { status: true, isActive: true },
  });
  return {
    total: screens.length,
    online: screens.filter((s) => s.status === "ONLINE").length,
    offline: screens.filter((s) => s.status === "OFFLINE").length,
    maintenance: screens.filter((s) => s.status === "MAINTENANCE").length,
  };
}
