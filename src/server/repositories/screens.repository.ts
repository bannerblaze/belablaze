import "server-only";

import { db } from "@/lib/db";
import type { Prisma, ScreenStatus, ScreenType } from "@prisma/client";

/* ──────────────────────────────────────────────────────────────────────
 * Screens repository — thin data-access layer over Prisma.
 *
 * All reads and writes are scoped by organizationId so callers never
 * need to remember to add the tenant filter themselves.
 * ────────────────────────────────────────────────────────────────────── */

export type ScreenRow = Prisma.ScreenGetPayload<Record<string, never>>;

export type CreateScreenInput = {
  organizationId: string;
  name: string;
  slug: string;
  code: string;
  type?: ScreenType;
  city: string;
  address: string;
  width: number;
  height: number;
  resolutionWidth?: number;
  resolutionHeight?: number;
  dailyTraffic?: number;
  pricePerSecond?: number;
  orientation?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
};

export type ScreenFilters = {
  search?: string;
  status?: string;
  city?: string;
  limit?: number;
  page?: number;
};

export async function createScreen(input: CreateScreenInput): Promise<ScreenRow> {
  return db.screen.create({
    data: {
      organizationId: input.organizationId,
      name:           input.name,
      slug:           input.slug,
      code:           input.code,
      type:           input.type ?? "LED_OUTDOOR",
      status:         "OFFLINE",
      city:           input.city,
      address:        input.address,
      width:          input.width,
      height:         input.height,
      resolutionWidth:  input.resolutionWidth  ?? 1920,
      resolutionHeight: input.resolutionHeight ?? 1080,
      dailyTraffic:   input.dailyTraffic   ?? 0,
      pricePerSecond: input.pricePerSecond ?? 0,
      orientation:    input.orientation    ?? "landscape",
      notes:          input.notes,
      latitude:       input.latitude,
      longitude:      input.longitude,
    },
  });
}

export async function getScreensByOrganization(
  organizationId: string,
  filters: ScreenFilters = {},
): Promise<ScreenRow[]> {
  const where: Prisma.ScreenWhereInput = { organizationId };

  if (filters.search) {
    where.OR = [
      { name:    { contains: filters.search, mode: "insensitive" } },
      { city:    { contains: filters.search, mode: "insensitive" } },
      { address: { contains: filters.search, mode: "insensitive" } },
      { code:    { contains: filters.search, mode: "insensitive" } },
      { slug:    { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.status && filters.status !== "all") {
    where.status = filters.status as ScreenStatus;
  }

  if (filters.city) {
    where.city = { contains: filters.city, mode: "insensitive" };
  }

  return db.screen.findMany({
    where,
    orderBy: [{ status: "asc" }, { city: "asc" }, { name: "asc" }],
    take: filters.limit ?? 100,
    skip: filters.page ? (filters.page - 1) * (filters.limit ?? 100) : 0,
  });
}

export async function getScreenById(
  id: string,
  organizationId: string,
) {
  return db.screen.findFirst({
    where: { id, organizationId },
    include: {
      adSchedules: {
        where: { isActive: true },
        include: { ad: { select: { id: true, title: true, status: true } } },
      },
    },
  });
}

export async function updateScreen(
  id: string,
  organizationId: string,
  data: Prisma.ScreenUpdateInput,
): Promise<number> {
  const result = await db.screen.updateMany({
    where: { id, organizationId },
    data,
  });
  return result.count;
}

export async function deleteScreen(
  id: string,
  organizationId: string,
): Promise<number> {
  const result = await db.screen.deleteMany({
    where: { id, organizationId },
  });
  return result.count;
}

export async function getScreenMetrics(organizationId: string) {
  const rows = await db.screen.findMany({
    where: { organizationId },
    select: { status: true, isActive: true },
  });
  return {
    total:       rows.length,
    online:      rows.filter((r) => r.status === "ONLINE").length,
    offline:     rows.filter((r) => r.status === "OFFLINE").length,
    maintenance: rows.filter((r) => r.status === "MAINTENANCE").length,
  };
}
