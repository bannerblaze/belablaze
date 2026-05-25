import { db } from "@/lib/db";

/* ──────────────────────────────────────────────────────────────────────
 * Screen-details repository — deep data fetch for the detail page.
 *
 * Queries are split to keep responsibility clear:
 *   getScreenWithFullData  — screen + campaigns + schedules (one query)
 *   getScreenAuditLog      — recent activity for the activity feed
 *   getScreenImpressionsTotal — aggregate impressions across all linked ads
 * ────────────────────────────────────────────────────────────────────── */

export async function getScreenWithFullData(screenId: string, organizationId: string) {
  return db.screen.findFirst({
    where: { id: screenId, organizationId },
    include: {
      /* Campaign-level assignments */
      screenCampaigns: {
        include: {
          campaign: {
            include: {
              ads: {
                include: {
                  mediaAsset: {
                    select: { url: true, storageKey: true, type: true, mimeType: true },
                  },
                },
                orderBy: { createdAt: "asc" },
              },
              client: { select: { name: true } },
            },
          },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      },
      /* Time-windowed ad schedules */
      adSchedules: {
        include: {
          ad: {
            include: {
              campaign: { select: { id: true, name: true, status: true } },
              mediaAsset: { select: { url: true, type: true } },
            },
          },
        },
        orderBy: { startTime: "asc" },
      },
    },
  });
}

export async function getScreenAuditLog(screenId: string, organizationId: string, limit = 25) {
  return db.auditLog.findMany({
    where: {
      organizationId,
      entityId: screenId,
    },
    include: {
      user: { select: { name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getScreenImpressionsTotal(screenId: string) {
  /* Aggregate impressions from ads linked to this screen via AdSchedule */
  const schedules = await db.adSchedule.findMany({
    where: { screenId },
    select: { adId: true },
  });

  const adIds = [...new Set(schedules.map((s) => s.adId))];
  if (adIds.length === 0) return 0;

  const result = await db.ad.aggregate({
    where: { id: { in: adIds } },
    _sum: { impressions: true },
  });

  return result._sum.impressions ?? 0;
}

export async function getScreenTrend(
  screenId: string,
  days: number = 7,
): Promise<{ date: string; impressions: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const rows = await db.metric.groupBy({
    by: ["date"],
    where: {
      screenId,
      date: { gte: since },
    },
    _sum: { impressions: true },
    orderBy: { date: "asc" },
  });

  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toISOString().split("T")[0]!;
    const found = rows.find((r) => new Date(r.date).toISOString().split("T")[0] === dateStr);
    return { date: dateStr, impressions: found?._sum.impressions ?? 0 };
  });
}
