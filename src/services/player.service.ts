import "server-only";

import { db } from "@/lib/db";

/* ──────────────────────────────────────────────────────────────────────
 * Player service — public-facing, authenticated via playerKey only.
 *
 * No Clerk session required. The playerKey acts as the device credential.
 * All queries are scoped to the screen record the key belongs to.
 * ────────────────────────────────────────────────────────────────────── */

export type PlayerScreen = {
  id: string;
  name: string;
  organizationId: string;
  resolutionWidth: number;
  resolutionHeight: number;
  orientation: string;
  status: string;
};

export type PlaylistItem = {
  adId: string;
  scheduleId: string;
  title: string;
  url: string;
  format: "IMAGE" | "VIDEO";
  mimeType: string | null;
  duration: number;
};

/** Resolves a screen by playerKey. Returns null when not found or inactive. */
export async function getPlayerScreen(playerKey: string): Promise<PlayerScreen | null> {
  const screen = await db.screen.findUnique({
    where: { playerKey },
    select: {
      id:              true,
      name:            true,
      organizationId:  true,
      resolutionWidth: true,
      resolutionHeight: true,
      orientation:     true,
      status:          true,
      isActive:        true,
    },
  });
  if (!screen || !screen.isActive) return null;
  return screen;
}

/**
 * Returns the active playlist for a screen right now.
 *
 * Active = AdSchedule is active AND the current wall-clock time falls
 * inside [startTime, endTime] for the current day AND the linked Ad/Campaign
 * are in ACTIVE status and within their date window.
 *
 * daysOfWeek uses JS convention: 0 = Sunday … 6 = Saturday.
 * startTime / endTime are "HH:mm" strings — lexicographic compare works
 * for same-day windows. Overnight spans (startTime > endTime) are not
 * supported in this version.
 */
export async function getActivePlaylist(screenId: string): Promise<PlaylistItem[]> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;

  const schedules = await db.adSchedule.findMany({
    where: {
      screenId,
      isActive: true,
      daysOfWeek: { has: dayOfWeek },
      startTime: { lte: timeStr },
      endTime:   { gte: timeStr },
      ad: {
        status: { in: ["ACTIVE", "PUBLISHED"] },
        campaign: {
          status:    "ACTIVE",
          startDate: { lte: now },
          endDate:   { gte: now },
        },
      },
    },
    include: {
      ad: {
        include: {
          mediaAsset: {
            select: {
              url:         true,
              type:        true,
              mimeType:    true,
              duration:    true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const items: PlaylistItem[] = [];

  for (const s of schedules) {
    const ad = s.ad;
    const url = ad.mediaAsset?.url ?? ad.fileUrl ?? null;
    if (!url) continue;

    const isVideo =
      ad.mediaAsset?.type === "VIDEO" ||
      ad.format === "VIDEO" ||
      ad.mediaAsset?.mimeType?.startsWith("video/");

    items.push({
      adId:       ad.id,
      scheduleId: s.id,
      title:      ad.title,
      url,
      format:     isVideo ? "VIDEO" : "IMAGE",
      mimeType:   ad.mediaAsset?.mimeType ?? null,
      duration:   ad.duration,
    });
  }

  return items;
}

/** Marks the screen as ONLINE and records the current timestamp. */
export async function recordHeartbeat(screenId: string): Promise<void> {
  await db.screen.update({
    where: { id: screenId },
    data: {
      lastSeenAt: new Date(),
      lastPingAt: new Date(),
      status:     "ONLINE",
    },
  });
}
