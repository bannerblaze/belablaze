import { NextRequest, NextResponse } from "next/server";
import { getScreens, getScreenMetrics } from "@/services/screens.service";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { isPlatformStaffSession } from "@/lib/access";
import { logAudit } from "@/actions/audit";

/* INTERNAL-only API. Non-staff callers get 403 before any DB access.
 * The service layer also re-checks, so even a bypass here returns
 * empty rows rather than tenant data. */

export async function GET(req: NextRequest) {
  try {
    if (!(await isPlatformStaffSession())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const city = searchParams.get("city") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "100");

    const [screens, metrics, total] = await Promise.all([
      getScreens({ search, status, city, page, limit }),
      getScreenMetrics(),
      db.screen.count({ where: { organizationId: ctx.organizationId } }),
    ]);

    return NextResponse.json({
      data: screens,
      metrics,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isPlatformStaffSession())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, type, city, address, width, height, resolutionWidth, resolutionHeight, dailyTraffic, pricePerSecond, orientation } = body;

    if (!name || !city || !address || !width || !height) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const code = `SCR-${Date.now().toString(36).toUpperCase()}`;

    const screen = await db.screen.create({
      data: {
        name,
        code,
        organizationId: ctx.organizationId,
        type: type ?? "LED_OUTDOOR",
        city,
        address,
        width: parseInt(width),
        height: parseInt(height),
        resolutionWidth: parseInt(resolutionWidth ?? "1920"),
        resolutionHeight: parseInt(resolutionHeight ?? "1080"),
        dailyTraffic: parseInt(dailyTraffic ?? "0"),
        pricePerSecond: parseFloat(pricePerSecond ?? "0"),
        orientation: orientation ?? "landscape",
        status: "ONLINE",
        lastPingAt: new Date(),
      },
    });

    await logAudit({ action: "screen.create", entityType: "Screen", entityId: screen.id, metadata: { name } });

    return NextResponse.json({ data: screen }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
