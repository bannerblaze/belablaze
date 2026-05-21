import { NextRequest, NextResponse } from "next/server";
import { getPlayerScreen, getActivePlaylist } from "@/services/player.service";

/* ──────────────────────────────────────────────────────────────────────
 * GET /api/player/playlist/[playerKey]
 *
 * Returns the current active playlist for the screen identified by
 * playerKey. Called by the client player every 30 seconds to refresh
 * its content without a full page reload.
 *
 * No Clerk session required — playerKey is the credential.
 * ────────────────────────────────────────────────────────────────────── */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ playerKey: string }> },
) {
  const { playerKey } = await params;

  const screen = await getPlayerScreen(playerKey);
  if (!screen) {
    return NextResponse.json({ error: "Screen not found" }, { status: 404 });
  }

  const playlist = await getActivePlaylist(screen.id);

  return NextResponse.json(
    {
      playlist,
      screen: {
        id:              screen.id,
        name:            screen.name,
        resolutionWidth: screen.resolutionWidth,
        resolutionHeight: screen.resolutionHeight,
        orientation:     screen.orientation,
      },
      serverTime: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
