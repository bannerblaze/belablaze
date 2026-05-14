import { NextRequest, NextResponse } from "next/server";
import { getAds } from "@/services/ads.service";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const campaignId = searchParams.get("campaignId") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const ads = await getAds({ search, status, page, limit });
    const total = await db.ad.count({
      where: {
        campaign: { organizationId: ctx.organizationId },
        ...(campaignId ? { campaignId } : {}),
      },
    });

    return NextResponse.json({
      data: ads,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
