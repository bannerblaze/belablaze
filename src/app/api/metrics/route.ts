import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDashboardMetrics, getChartData, getTopCampaigns, getCityMetrics } from "@/services/analytics.service";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") ?? "30");
    const type = searchParams.get("type") ?? "all";

    if (type === "chart") {
      const data = await getChartData(days);
      return NextResponse.json({ data });
    }

    if (type === "top-campaigns") {
      const data = await getTopCampaigns(5);
      return NextResponse.json({ data });
    }

    if (type === "cities") {
      const data = await getCityMetrics();
      return NextResponse.json({ data });
    }

    const [metrics, chartData, topCampaigns, cityMetrics] = await Promise.all([
      getDashboardMetrics(),
      getChartData(days),
      getTopCampaigns(5),
      getCityMetrics(),
    ]);

    return NextResponse.json({ data: { metrics, chartData, topCampaigns, cityMetrics } });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
