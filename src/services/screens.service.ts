import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { FilterOptions } from "@/types";
import { getOrgContext } from "@/lib/org-context";
import { isPlatformStaffSession } from "@/lib/access";

/* ──────────────────────────────────────────────────────────────────────
 * Screen queries — INTERNAL-only.
 *
 * Pantallas DOOH is a BannerBlaze-internal operations module. Every
 * read here checks isPlatformStaffSession() FIRST and returns empty
 * results otherwise — even if a non-staff caller somehow imports the
 * service directly (e.g. a misplaced API route or a future server
 * component that forgets the layout gate), they get nothing.
 *
 * This is the fourth layer of defense behind the layout, page,
 * actions, and API routes. Cheap to call (single user lookup) and
 * cheaper to maintain than auditing every future caller.
 * ────────────────────────────────────────────────────────────────────── */

export async function getScreens(filters: FilterOptions = {}) {
  if (!(await isPlatformStaffSession())) return [];

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
  if (!(await isPlatformStaffSession())) return null;

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
  if (!(await isPlatformStaffSession())) {
    return { total: 0, online: 0, offline: 0, maintenance: 0 };
  }

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
