import "server-only";

import { db } from "@/lib/db";

/* ──────────────────────────────────────────────────────────────────────
 * Player service — public-facing, authenticated via playerKey only.
 *
 * No Clerk session required. The playerKey acts as the device credential.
 * All queries are scoped to the screen record the key belongs to.
 *
 * Playlist sources (merged, deduplicated by adId):
 *   1. AdSchedule — time-windowed ads (specific ad → specific screen)
 *   2. ScreenCampaign — campaign-level assignments (all active ads in
 *      a campaign play on an assigned screen)
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
      id:               true,
      name:             true,
      organizationId:   true,
      resolutionWidth:  true,
      resolutionHeight: true,
      orientation:      true,
      status:           true,
      isActive:         true,
    },
  });
  if (!screen || !screen.isActive) return null;
  return screen;
}

/**
 * Source 1: ads via AdSchedule (time-windowed, specific ad → screen).
 * daysOfWeek uses JS convention: 0 = Sunday … 6 = Saturday.
 * Overnight spans (startTime > endTime) are not supported.
 */
async function getAdScheduleItems(screenId: string, now: Date): Promise<PlaylistItem[]> {
  const dayOfWeek = now.getDay();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;

  const schedules = await db.adSchedule.findMany({
    where: {
      screenId,
      isActive: true,
      daysOfWeek: { has: dayOfWeek },
      startTime:  { lte: timeStr },
      endTime:    { gte: timeStr },
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
            select: { url: true, type: true, mimeType: true, duration: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const items: PlaylistItem[] = [];
  for (const s of schedules) {
    const url = s.ad.mediaAsset?.url ?? s.ad.fileUrl ?? null;
    if (!url) continue;
    items.push({
      adId:      s.ad.id,
      scheduleId: s.id,
      title:     s.ad.title,
      url,
      format:    isVideoAd(s.ad) ? "VIDEO" : "IMAGE",
      mimeType:  s.ad.mediaAsset?.mimeType ?? null,
      duration:  s.ad.duration,
    });
  }
  return items;
}

/**
 * Source 2: ads via ScreenCampaign (campaign-level assignment).
 * All active ads in an assigned campaign play on the screen.
 * Sorted by ScreenCampaign.priority DESC so higher-priority campaigns
 * appear first in the playlist.
 */
async function getScreenCampaignItems(screenId: string, now: Date): Promise<PlaylistItem[]> {
  const assignments = await db.screenCampaign.findMany({
    where: {
      screenId,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      campaign: {
        status:    "ACTIVE",
        startDate: { lte: now },
        endDate:   { gte: now },
      },
    },
    include: {
      campaign: {
        include: {
          ads: {
            where: { status: { in: ["ACTIVE", "PUBLISHED"] } },
            include: {
              mediaAsset: {
                select: { url: true, type: true, mimeType: true, duration: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
    orderBy: { priority: "desc" },
  });

  const items: PlaylistItem[] = [];
  for (const assignment of assignments) {
    for (const ad of assignment.campaign.ads) {
      const url = ad.mediaAsset?.url ?? ad.fileUrl ?? null;
      if (!url) continue;
      items.push({
        adId:       ad.id,
        scheduleId: assignment.id,
        title:      ad.title,
        url,
        format:     isVideoAd(ad) ? "VIDEO" : "IMAGE",
        mimeType:   ad.mediaAsset?.mimeType ?? null,
        duration:   ad.duration,
      });
    }
  }
  return items;
}

function isVideoAd(ad: { format: string; mediaAsset?: { type: string; mimeType: string | null } | null }): boolean {
  return (
    ad.format === "VIDEO" ||
    ad.mediaAsset?.type === "VIDEO" ||
    (ad.mediaAsset?.mimeType?.startsWith("video/") ?? false)
  );
}

/**
 * Returns the merged, deduplicated active playlist for a screen.
 * AdSchedule items first (time-targeted), then ScreenCampaign items.
 */
export async function getActivePlaylist(screenId: string): Promise<PlaylistItem[]> {
  const now = new Date();

  const [scheduleItems, campaignItems] = await Promise.all([
    getAdScheduleItems(screenId, now),
    getScreenCampaignItems(screenId, now),
  ]);

  // Merge and deduplicate by adId — AdSchedule takes precedence
  const seen = new Set<string>();
  const playlist: PlaylistItem[] = [];

  for (const item of [...scheduleItems, ...campaignItems]) {
    if (!seen.has(item.adId)) {
      seen.add(item.adId);
      playlist.push(item);
    }
  }

  return playlist;
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
