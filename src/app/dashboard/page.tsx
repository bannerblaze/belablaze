import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { DashboardClient } from "./_client";
import { AdminDashboardClient } from "./admin-dashboard-client";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { OrgUsageCard } from "@/components/dashboard/org-usage-card";
import {
  mockDashboardMetrics, mockChartData, mockRecentActivity,
  mockCampaigns, mockScreens,
} from "@/lib/mock-data";
import { getDashboardMetrics, getChartData, getRecentActivity } from "@/services/analytics.service";
import { getAdminDashboardMetrics } from "@/services/admin-dashboard.service";
import { getCampaigns } from "@/services/campaigns.service";
import { getScreens } from "@/services/screens.service";
import { getCurrentUser } from "@/lib/auth";
import type { DashboardMetrics, ChartDataPoint } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Dashboard — tolerant rendering.
 *
 * Static imports (not dynamic) so Turbopack can resolve server-only
 * module chains correctly at compile time.
 *
 * Each data source is individually wrapped in safe() so one failing
 * service never crashes the whole page.
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

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

async function DashboardData() {
  const hasDb = !!process.env.DATABASE_URL;

  let userName = "Usuario";
  try {
    const clerkUser = await currentUser();
    userName = clerkUser?.fullName ?? clerkUser?.firstName ?? "Usuario";
  } catch {
    // Clerk unavailable — use default
  }

  // Bifurcar vista según tipo de cuenta
  if (hasDb) {
    try {
      const dbUser = await getCurrentUser();
      if (dbUser?.accountType === "INTERNAL") {
        const adminMetrics = await getAdminDashboardMetrics();
        return <AdminDashboardClient data={adminMetrics} />;
      }
    } catch {
      // Si falla la resolución del user, continuar con dashboard normal
    }
  }

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

  const [metrics, chartData, recentActivity, campaigns, screens] = await Promise.all([
    safe(() => getDashboardMetrics(), EMPTY_METRICS),
    safe(() => getChartData(30), [] as ChartDataPoint[]),
    safe(() => getRecentActivity(6), []),
    safe(() => getCampaigns({ limit: 4 }), []),
    safe(() => getScreens({ limit: 4 }), []),
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
