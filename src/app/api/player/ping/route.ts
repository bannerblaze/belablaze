import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ──────────────────────────────────────────────────────────────────────
 * POST /api/player/ping
 *
 * Heartbeat endpoint called by the DOOH player every 15 seconds.
 * Authenticated by playerKey (no Clerk session required).
 *
 * Body: { playerKey, currentAdId?, uptime, resolution: {w, h} }
 *
 * Side effects:
 *   • Sets Screen.lastSeenAt = now
 *   • Sets Screen.lastPingAt = now
 *   • Sets Screen.status = "ONLINE"
 * ────────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  let body: {
    playerKey?: string;
    currentAdId?: string;
    uptime?: number;
    resolution?: { width: number; height: number };
  };

  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { playerKey, currentAdId, uptime, resolution } = body;

  if (!playerKey || typeof playerKey !== "string") {
    return NextResponse.json({ error: "playerKey required" }, { status: 400 });
  }

  const screen = await db.screen.findUnique({
    where: { playerKey },
    select: { id: true, isActive: true },
  });

  if (!screen || !screen.isActive) {
    return NextResponse.json({ error: "Screen not found" }, { status: 404 });
  }

  await db.screen.update({
    where: { id: screen.id },
    data: {
      lastSeenAt: new Date(),
      lastPingAt: new Date(),
      status:     "ONLINE",
    },
  });

  // Track impression if there's an active ad — fire-and-forget
  if (currentAdId && typeof currentAdId === "string") {
    db.ad.updateMany({
      where: { id: currentAdId },
      data:  { impressions: { increment: 1 } },
    }).catch(() => {});
  }

  return NextResponse.json({
    ok:        true,
    serverTime: new Date().toISOString(),
    uptimeAck:  uptime,
    resolution: resolution ?? null,
  });
}
