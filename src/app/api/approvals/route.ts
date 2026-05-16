import { NextRequest, NextResponse } from "next/server";
import { getAdsForApprovals } from "@/services/ads.service";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { logAudit } from "@/actions/audit";

export async function GET(_req: NextRequest) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await getAdsForApprovals();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { adId, action, note } = await req.json();
    if (!adId || !action) return NextResponse.json({ error: "Missing adId or action" }, { status: 400 });

    // Verify the ad belongs to the caller's org via its campaign.
    const ad = await db.ad.findFirst({
      where: { id: adId, campaign: { organizationId: ctx.organizationId } },
      select: { id: true },
    });
    if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const approved = action === "approve";
    const status = approved ? "APPROVED" : "REJECTED";

    await db.$transaction([
      db.ad.update({ where: { id: adId }, data: { status, ...(note && { rejectionNote: note }) } }),
      db.adApproval.create({ data: { adId, userId: ctx.userId, approved, note } }),
    ]);

    await logAudit({
      action: approved ? "ad.approve" : "ad.reject",
      entityType: "Ad",
      entityId: adId,
      metadata: note ? { note } : undefined,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
