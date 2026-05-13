import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { DashboardClient } from "./_client";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { OrgActivityCard } from "@/components/dashboard/org-activity-card";
import { OrgUsageCard } from "@/components/dashboard/org-usage-card";
import {
  mockDashboardMetrics, mockChartData, mockRecentActivity,
  mockCampaigns, mockScreens,
} from "@/lib/mock-data";

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
    getDashboardMetrics(),
    getChartData(30),
    getRecentActivity(6),
    getCampaigns({ limit: 4 }),
    getScreens({ limit: 4 }),
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
      <section className="px-4 sm:px-6 lg:px-8 pb-6 max-w-[1400px] grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Suspense>
          <OrgUsageCard />
        </Suspense>
        <Suspense>
          <OrgActivityCard />
        </Suspense>
      </section>
    </Suspense>
  );
}
