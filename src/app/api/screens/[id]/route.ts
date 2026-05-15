import { NextRequest, NextResponse } from "next/server";
import { getScreenById } from "@/services/screens.service";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { isPlatformStaffSession } from "@/lib/access";
import { can } from "@/lib/rbac";
import { logAudit } from "@/actions/audit";

/* INTERNAL-only API. See /api/screens/route.ts for the policy. */

async function loadOrgScreen(orgId: string, screenId: string) {
  return db.screen.findFirst({
    where: { id: screenId, organizationId: orgId },
    select: { id: true },
  });
}

export async function GET(
  _req: NextRequest,
  routeCtx: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isPlatformStaffSession())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!can(ctx.role, "screens:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await routeCtx.params;
    // getScreenById is already org-scoped + platform-staff-gated.
    const screen = await getScreenById(id);
    if (!screen) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: screen });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  routeCtx: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isPlatformStaffSession())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!can(ctx.role, "screens:update")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await routeCtx.params;
    const exists = await loadOrgScreen(ctx.organizationId, id);
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const screen = await db.screen.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status, lastPingAt: body.status === "ONLINE" ? new Date() : undefined }),
        ...(body.name && { name: body.name }),
        ...(body.address && { address: body.address }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    await logAudit({ action: "screen.update", entityType: "Screen", entityId: id, metadata: body });
    return NextResponse.json({ data: screen });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  routeCtx: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isPlatformStaffSession())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!can(ctx.role, "screens:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await routeCtx.params;
    const exists = await loadOrgScreen(ctx.organizationId, id);
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.screen.delete({ where: { id } });
    await logAudit({ action: "screen.delete", entityType: "Screen", entityId: id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
