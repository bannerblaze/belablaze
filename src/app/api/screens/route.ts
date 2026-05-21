import { NextRequest, NextResponse } from "next/server";
import { getScreens, getScreenMetrics } from "@/services/screens.service";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { logAudit } from "@/actions/audit";

/* Org-scoped REST endpoint for DOOH screens.
 * Callers must be authenticated with a resolvable org context.
 * Server Actions are preferred for mutations; this route exists for
 * external integrations and the player heartbeat path. */

export async function GET(req: NextRequest) {
  try {
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
    const ctx = await getOrgContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      name?: string;
      type?: string;
      city?: string;
      address?: string;
      width?: string | number;
      height?: string | number;
      resolutionWidth?: string | number;
      resolutionHeight?: string | number;
      dailyTraffic?: string | number;
      pricePerSecond?: string | number;
      orientation?: string;
    };
    const { name, type, city, address, width, height, resolutionWidth, resolutionHeight, dailyTraffic, pricePerSecond, orientation } = body;

    if (!name || !city || !address || !width || !height) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const code = `SCR-${Date.now().toString(36).toUpperCase()}`;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40)
      .concat(`-${Date.now().toString(36)}`);

    const screen = await db.screen.create({
      data: {
        name,
        slug,
        code,
        organizationId: ctx.organizationId,
        type: (type ?? "LED_OUTDOOR") as import("@prisma/client").ScreenType,
        city,
        address,
        width:           parseInt(String(width)),
        height:          parseInt(String(height)),
        resolutionWidth: parseInt(String(resolutionWidth ?? "1920")),
        resolutionHeight: parseInt(String(resolutionHeight ?? "1080")),
        dailyTraffic:   parseInt(String(dailyTraffic ?? "0")),
        pricePerSecond: parseFloat(String(pricePerSecond ?? "0")),
        orientation:    orientation ?? "landscape",
        status:         "OFFLINE",
      },
    });

    await logAudit({ action: "screen.create", entityType: "Screen", entityId: screen.id, metadata: { name } });

    return NextResponse.json({ data: screen }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
