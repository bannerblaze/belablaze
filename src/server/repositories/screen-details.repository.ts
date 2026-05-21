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
                    select: { url: true, type: true, mimeType: true },
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
