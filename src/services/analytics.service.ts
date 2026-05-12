import { db } from "@/lib/db";
import type { DashboardMetrics, ChartDataPoint } from "@/types";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    campaigns,
    screens,
    pendingAds,
    currentMetrics,
    previousMetrics,
  ] = await Promise.all([
    db.campaign.findMany({ where: { status: { in: ["ACTIVE", "COMPLETED"] } }, select: { status: true, spent: true } }),
    db.screen.findMany({ select: { status: true } }),
    db.ad.count({ where: { status: "PENDING_REVIEW" } }),
    db.metric.aggregate({
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { impressions: true, clicks: true, qrScans: true, engagements: true },
    }),
    db.metric.aggregate({
      where: { date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { impressions: true, qrScans: true },
    }),
  ]);

  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const onlineScreens = screens.filter((s) => s.status === "ONLINE").length;

  const totalImpressions = currentMetrics._sum.impressions ?? 0;
  const prevImpressions = previousMetrics._sum.impressions ?? 0;
  const qrScans = currentMetrics._sum.qrScans ?? 0;
  const prevQrScans = previousMetrics._sum.qrScans ?? 0;
  const totalClicks = currentMetrics._sum.clicks ?? 0;
  const totalEngagements = currentMetrics._sum.engagements ?? 0;

  const delta = (curr: number, prev: number) =>
    prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100);

  return {
    totalImpressions,
    impressionsDelta: delta(totalImpressions, prevImpressions),
    activeCampaigns,
    campaignsDelta: 0,
    totalRevenue,
    revenueDelta: 0,
    avgEngagement: totalImpressions > 0 ? parseFloat(((totalEngagements / totalImpressions) * 100).toFixed(1)) : 0,
    engagementDelta: 0,
    screensOnline: onlineScreens,
    screensTotal: screens.length,
    pendingApprovals: pendingAds,
    qrScans,
    qrScansDelta: delta(qrScans, prevQrScans),
  };
}

export async function getChartData(days = 30): Promise<ChartDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const metrics = await db.metric.groupBy({
    by: ["date"],
    where: { date: { gte: startDate } },
    _sum: { impressions: true, clicks: true, engagements: true, qrScans: true },
    orderBy: { date: "asc" },
  });

  return metrics.map((m) => ({
    date: m.date.toISOString().split("T")[0],
    impressions: m._sum.impressions ?? 0,
    clicks: m._sum.clicks ?? 0,
    engagements: m._sum.engagements ?? 0,
    qrScans: m._sum.qrScans ?? 0,
    revenue: (m._sum.impressions ?? 0) * 0.0015,
  }));
}

export async function getTopCampaigns(limit = 5) {
  const campaigns = await db.campaign.findMany({
    select: {
      id: true,
      name: true,
      impressions: true,
      spent: true,
      budget: true,
      status: true,
      client: { select: { name: true } },
    },
    orderBy: { impressions: "desc" },
    take: limit,
  });
  return campaigns;
}

export async function getCityMetrics() {
  const screens = await db.screen.findMany({ select: { id: true, city: true, dailyTraffic: true } });

  const metricsByScreen = await db.metric.groupBy({
    by: ["screenId"],
    where: { screenId: { not: null } },
    _sum: { impressions: true, clicks: true },
  });

  const cityMap = new Map<string, { impressions: number; clicks: number; traffic: number }>();

  for (const screen of screens) {
    const existing = cityMap.get(screen.city) ?? { impressions: 0, clicks: 0, traffic: 0 };
    cityMap.set(screen.city, { ...existing, traffic: existing.traffic + screen.dailyTraffic });
  }

  for (const m of metricsByScreen) {
    if (!m.screenId) continue;
    const screen = screens.find((s) => s.id === m.screenId);
    if (!screen) continue;
    const existing = cityMap.get(screen.city) ?? { impressions: 0, clicks: 0, traffic: 0 };
    cityMap.set(screen.city, {
      ...existing,
      impressions: existing.impressions + (m._sum.impressions ?? 0),
      clicks: existing.clicks + (m._sum.clicks ?? 0),
    });
  }

  const cityData = Array.from(cityMap.entries()).map(([city, data]) => ({ city, ...data }));

  if (cityData.every((c) => c.impressions === 0)) {
    return cityData.map((c) => ({ ...c, impressions: c.traffic * 30 })).sort((a, b) => b.impressions - a.impressions);
  }

  return cityData.sort((a, b) => b.impressions - a.impressions);
}

export async function getRecentActivity(limit = 8) {
  const logs = await db.log.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, avatar: true } } },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    entityName: log.newData
      ? (log.newData as Record<string, string>)?.name ?? log.entity
      : log.entity,
    user: log.user?.name ?? "Sistema",
    time: log.createdAt.toISOString(),
  }));
}
