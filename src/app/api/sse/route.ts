import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { getDashboardMetrics } = await import("@/services/analytics.service");
  const metrics = await getDashboardMetrics();

  return NextResponse.json({
    metrics,
    timestamp: new Date().toISOString(),
  });
}
