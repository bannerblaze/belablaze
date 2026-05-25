import "server-only";
import { db } from "@/lib/db";

export async function getAdminDashboardMetrics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalOrgs,
    newOrgsThisMonth,
    activeCampaigns,
    screensOnline,
    pendingAds,
    totalAdsApproved,
    totalAdsRejected,
    impressionsToday,
    topOrgs,
    recentActivityRaw,
    chartDataRaw,
  ] = await Promise.all([
    db.organization.count({ where: { isActive: true } }),
    db.organization.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.campaign.count({ where: { status: "ACTIVE" } }),
    db.screen.count({ where: { status: "ONLINE", isActive: true } }),
    db.ad.count({ where: { status: "PENDING_REVIEW" } }),
    db.ad.count({ where: { status: { in: ["APPROVED", "PUBLISHED", "ACTIVE"] } } }),
    db.ad.count({ where: { status: "REJECTED" } }),
    db.metric.aggregate({
      where: { date: { gte: startOfDay } },
      _sum: { impressions: true },
    }),
    db.organization.findMany({
      where: { isActive: true },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { campaigns: { where: { status: "ACTIVE" } } },
        },
        campaigns: {
          where: { status: "ACTIVE" },
          select: { budget: true, spent: true, impressions: true },
        },
      },
    }),
    db.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
    }),
    db.metric.groupBy({
      by: ["date"],
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { impressions: true, clicks: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const revenueThisMonth = await db.campaign.aggregate({
    where: {
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: startOfMonth },
    },
    _sum: { budget: true, spent: true },
  });

  const totalReviewed = totalAdsApproved + totalAdsRejected;
  const approvalRate = totalReviewed > 0
    ? Math.round((totalAdsApproved / totalReviewed) * 100)
    : 0;

  const topOrgsFormatted = topOrgs.map((org) => ({
    id: org.id,
    name: org.name,
    activeCampaigns: org._count.campaigns,
    totalBudget: org.campaigns.reduce((s, c) => s + c.budget, 0),
    totalSpent: org.campaigns.reduce((s, c) => s + c.spent, 0),
    totalImpressions: org.campaigns.reduce((s, c) => s + c.impressions, 0),
  }));

  const recentActivity = recentActivityRaw.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    createdAt: log.createdAt.toISOString(),
    user: log.user ? { name: log.user.name, email: log.user.email } : null,
    organization: log.organization ? { name: log.organization.name } : null,
  }));

  const chartData = chartDataRaw.map((row) => ({
    date: new Date(row.date).toISOString().split("T")[0]!,
    impressions: row._sum.impressions ?? 0,
    clicks: row._sum.clicks ?? 0,
  }));

  return {
    kpis: {
      totalOrgs,
      newOrgsThisMonth,
      activeCampaigns,
      screensOnline,
      pendingAds,
      approvalRate,
      impressionsToday: impressionsToday._sum.impressions ?? 0,
      revenueThisMonth: revenueThisMonth._sum.budget ?? 0,
      spentThisMonth: revenueThisMonth._sum.spent ?? 0,
    },
    topOrgs: topOrgsFormatted,
    recentActivity,
    chartData,
  };
}
