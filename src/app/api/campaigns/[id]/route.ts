import { NextRequest, NextResponse } from "next/server";
import { getCampaignById } from "@/services/campaigns.service";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { logAudit } from "@/actions/audit";

async function loadOrgCampaign(orgId: string, campaignId: string) {
  return db.campaign.findFirst({
    where: { id: campaignId, organizationId: orgId },
    select: { id: true },
  });
}

export async function GET(
  _req: NextRequest,
  routeCtx: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await routeCtx.params;
    const campaign = await getCampaignById(id);
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: campaign });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  routeCtx: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await routeCtx.params;
    const exists = await loadOrgCampaign(ctx.organizationId, id);
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const campaign = await db.campaign.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.budget !== undefined && { budget: parseFloat(body.budget) }),
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.endDate && { endDate: new Date(body.endDate) }),
        ...(body.targetCities && { targetCities: body.targetCities }),
      },
    });

    await logAudit({ action: "campaign.update", entityType: "Campaign", entityId: id, metadata: body });
    return NextResponse.json({ data: campaign });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  routeCtx: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await routeCtx.params;
    const exists = await loadOrgCampaign(ctx.organizationId, id);
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.campaign.delete({ where: { id } });
    await logAudit({ action: "campaign.delete", entityType: "Campaign", entityId: id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
