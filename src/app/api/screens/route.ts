import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getScreens, getScreenMetrics } from "@/services/screens.service";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const city = searchParams.get("city") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "100");

    const [screens, metrics, total] = await Promise.all([
      getScreens({ search, status, city, page, limit }),
      getScreenMetrics(),
      db.screen.count(),
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
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, role: true } });
    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "EXECUTIVE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    await db.log.create({
      data: { userId: dbUser.id, action: "CREATE", entity: "Screen", entityId: screen.id, newData: { name } },
    });

    return NextResponse.json({ data: screen }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
