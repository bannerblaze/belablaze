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
    completed?: boolean;
    uptime?: number;
    resolution?: { width: number; height: number };
  };

  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { playerKey, currentAdId, completed, uptime, resolution } = body;

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

  // Count impression only when the ad completed a full playback cycle
  if (completed === true && currentAdId && typeof currentAdId === "string") {
    const now  = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    db.ad.updateMany({
      where: { id: currentAdId },
      data:  { impressions: { increment: 1 } },
    }).catch(() => {});
    db.metric.create({
      data: {
        adId:        currentAdId,
        screenId:    screen.id,
        impressions: 1,
        date,
        hour:        now.getHours(),
      },
    }).catch(() => {});
  }

  return NextResponse.json({
    ok:        true,
    serverTime: new Date().toISOString(),
    uptimeAck:  uptime,
    resolution: resolution ?? null,
  });
}
