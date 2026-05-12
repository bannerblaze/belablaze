import { Suspense } from "react";
import { connection } from "next/server";
import { AnalyticsClient } from "./_client";

function AnalyticsSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 space-y-5 max-w-[1400px]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-white/[0.03] animate-pulse" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="h-48 rounded-xl bg-white/[0.03] animate-pulse" />
        <div className="h-48 rounded-xl bg-white/[0.03] animate-pulse" />
      </div>
    </div>
  );
}

async function AnalyticsData() {
  await connection();

  const { getChartData, getDashboardMetrics, getTopCampaigns, getCityMetrics } = await import("@/services/analytics.service");
  const [chartData, metrics, topCampaigns, cityMetrics] = await Promise.all([
    getChartData(90),
    getDashboardMetrics(),
    getTopCampaigns(5),
    getCityMetrics(),
  ]);

  return <AnalyticsClient chartData={chartData} metrics={metrics} topCampaigns={topCampaigns} cityMetrics={cityMetrics} />;
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsData />
    </Suspense>
  );
}
