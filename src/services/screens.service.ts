import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { FilterOptions } from "@/types";

export async function getScreens(filters: FilterOptions = {}) {
  const where: Prisma.ScreenWhereInput = {};

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
  const screen = await db.screen.findUnique({
    where: { id },
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
  const screens = await db.screen.findMany({ select: { status: true, isActive: true } });
  return {
    total: screens.length,
    online: screens.filter((s) => s.status === "ONLINE").length,
    offline: screens.filter((s) => s.status === "OFFLINE").length,
    maintenance: screens.filter((s) => s.status === "MAINTENANCE").length,
  };
}
