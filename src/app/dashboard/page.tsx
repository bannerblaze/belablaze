import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { DashboardClient } from "./_client";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { OrgUsageCard } from "@/components/dashboard/org-usage-card";
import {
  mockDashboardMetrics, mockChartData, mockRecentActivity,
  mockCampaigns, mockScreens,
} from "@/lib/mock-data";
import type { DashboardMetrics, ChartDataPoint } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Dashboard page — tolerant rendering.
 *
 * Each data source is fetched independently with its own fallback.
 * A single failing service never crashes the whole page — it just shows
 * an empty state for that widget. This is intentional: the dashboard
 * is a "health-at-a-glance" surface and must always render.
 * ────────────────────────────────────────────────────────────────────── */

const EMPTY_METRICS: DashboardMetrics = {
  totalImpressions: 0, impressionsDelta: 0,
  activeCampaigns: 0, campaignsDelta: 0,
  totalRevenue: 0, revenueDelta: 0,
  avgEngagement: 0, engagementDelta: 0,
  screensOnline: 0, screensTotal: 0,
  pendingApprovals: 0,
  qrScans: 0, qrScansDelta: 0,
};

async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

async function DashboardData() {
  const hasDb = !!process.env.DATABASE_URL;
  const clerkUser = await currentUser();
  const userName = clerkUser?.fullName ?? clerkUser?.firstName ?? "Usuario";

  if (!hasDb) {
    return (
      <DashboardClient
        metrics={mockDashboardMetrics}
        chartData={mockChartData}
        recentActivity={mockRecentActivity}
        campaigns={mockCampaigns}
        screens={mockScreens}
        userName={userName}
      />
    );
  }

  const [
    { getDashboardMetrics, getChartData, getRecentActivity },
    { getCampaigns },
    { getScreens },
  ] = await Promise.all([
    import("@/services/analytics.service"),
    import("@/services/campaigns.service"),
    import("@/services/screens.service"),
  ]);

  const [metrics, chartData, recentActivity, campaigns, screens] = await Promise.all([
    safeCall(() => getDashboardMetrics(), EMPTY_METRICS),
    safeCall(() => getChartData(30), [] as ChartDataPoint[]),
    safeCall(() => getRecentActivity(6), []),
    safeCall(() => getCampaigns({ limit: 4 }), []),
    safeCall(() => getScreens({ limit: 4 }), []),
  ]);

  return (
    <DashboardClient
      metrics={metrics}
      chartData={chartData}
      recentActivity={recentActivity}
      campaigns={campaigns as Parameters<typeof DashboardClient>[0]["campaigns"]}
      screens={screens as Parameters<typeof DashboardClient>[0]["screens"]}
      userName={userName}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
      <section className="px-4 sm:px-6 lg:px-8 pb-6 max-w-[1600px]">
        <Suspense>
          <OrgUsageCard />
        </Suspense>
      </section>
    </Suspense>
  );
}
