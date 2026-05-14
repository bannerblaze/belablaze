import { NextRequest, NextResponse } from "next/server";
import { getCampaigns, getCampaignMetrics } from "@/services/campaigns.service";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const clientId = searchParams.get("clientId") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const [campaigns, metrics, total] = await Promise.all([
      getCampaigns({ search, status, clientId, page, limit }),
      getCampaignMetrics(),
      db.campaign.count({ where: { organizationId: ctx.organizationId } }),
    ]);

    return NextResponse.json({
      data: campaigns,
      metrics,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
