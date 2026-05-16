import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { logAudit } from "@/actions/audit";

/* Tenant-scoped ad endpoint. Every operation verifies the ad belongs
 * to the active org via its parent campaign before touching the row. */

async function loadOrgAd(orgId: string, adId: string) {
  return db.ad.findFirst({
    where: { id: adId, campaign: { organizationId: orgId } },
    select: { id: true, status: true },
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
    const ad = await db.ad.findFirst({
      where: { id, campaign: { organizationId: ctx.organizationId } },
      include: {
        campaign: { include: { client: { select: { id: true, name: true } } } },
        approvals: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 1 },
        metrics: { orderBy: { date: "desc" }, take: 30 },
      },
    });

    if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: ad });
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
    const existing = await loadOrgAd(ctx.organizationId, id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const ad = await db.ad.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
      },
    });

    await logAudit({ action: "ad.update", entityType: "Ad", entityId: id, metadata: body });
    return NextResponse.json({ data: ad });
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
    const existing = await loadOrgAd(ctx.organizationId, id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.ad.delete({ where: { id } });
    await logAudit({ action: "ad.delete", entityType: "Ad", entityId: id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
