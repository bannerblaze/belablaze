import { getOrgContext } from "@/lib/org-context";
import { db } from "@/lib/db";
import type { FilterOptions } from "@/types";
import {
  getScreenById as repoGetById,
  getScreenMetrics as repoGetMetrics,
} from "@/server/repositories/screens.repository";

/* ──────────────────────────────────────────────────────────────────────
 * Screen read queries — org-scoped.
 *
 * getScreens() is the primary read path for the /screens dashboard.
 * It includes campaign assignments so the detail panel can show them
 * without a secondary fetch.
 * ────────────────────────────────────────────────────────────────────── */

type Dates<T> = Omit<T, "lastPingAt" | "lastSeenAt" | "createdAt" | "updatedAt"> & {
  lastPingAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function serializeDates<T extends { lastPingAt: Date | null; lastSeenAt: Date | null; createdAt: Date; updatedAt: Date }>(s: T): Dates<T> {
  return {
    ...s,
    lastPingAt: s.lastPingAt?.toISOString()  ?? null,
    lastSeenAt: s.lastSeenAt?.toISOString()  ?? null,
    createdAt:  s.createdAt.toISOString(),
    updatedAt:  s.updatedAt.toISOString(),
  };
}

export async function getScreens(filters: FilterOptions = {}) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return [];

    const where: Record<string, unknown> = { organizationId: ctx.organizationId };

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
      where.status = filters.status;
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: "insensitive" };
    }

    const screens = await db.screen.findMany({
      where,
      include: {
        screenCampaigns: {
          include: {
            campaign: {
              select: {
                id: true, name: true, status: true,
                startDate: true, endDate: true,
                client: { select: { name: true } },
              },
            },
          },
          orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ status: "asc" }, { city: "asc" }, { name: "asc" }],
      take: filters.limit ?? 100,
      skip: filters.page ? (filters.page - 1) * (filters.limit ?? 100) : 0,
    });

    return screens.map((s) => ({
      ...serializeDates(s),
      screenCampaigns: s.screenCampaigns.map((sc) => ({
        id:         sc.id,
        campaignId: sc.campaignId,
        priority:   sc.priority,
        isActive:   sc.isActive,
        startsAt:   sc.startsAt?.toISOString() ?? null,
        endsAt:     sc.endsAt?.toISOString()   ?? null,
        campaign: {
          id:        sc.campaign.id,
          name:      sc.campaign.name,
          status:    sc.campaign.status,
          startDate: sc.campaign.startDate.toISOString(),
          endDate:   sc.campaign.endDate.toISOString(),
          client:    sc.campaign.client,
        },
      })),
    }));
  } catch {
    return [];
  }
}

export async function getScreenById(id: string) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return null;

    const screen = await repoGetById(id, ctx.organizationId);
    if (!screen) return null;

    return serializeDates(screen);
  } catch {
    return null;
  }
}

export async function getScreenMetrics() {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return { total: 0, online: 0, offline: 0, maintenance: 0 };

    return repoGetMetrics(ctx.organizationId);
  } catch {
    return { total: 0, online: 0, offline: 0, maintenance: 0 };
  }
}
