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
 *
 * Playable statuses (intentionally broad — content is ready when it
 * has media and has not been rejected/paused/cancelled):
 *   Campaigns: ACTIVE | APPROVED | DRAFT
 *   Ads:       ACTIVE | PUBLISHED | APPROVED | DRAFT
 * ────────────────────────────────────────────────────────────────────── */

const R2_BASE = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

/** Ensures the URL is absolute. Falls back to storageKey + R2_BASE. */
function resolveUrl(
  url: string | null | undefined,
  storageKey: string | null | undefined,
): string | null {
  if (url?.startsWith("http://") || url?.startsWith("https://")) return url;
  if (storageKey && R2_BASE) return `${R2_BASE}/${storageKey}`;
  return url ?? null;
}

const PLAYABLE_CAMPAIGN_STATUSES = ["ACTIVE", "APPROVED", "DRAFT"] as const;
const PLAYABLE_AD_STATUSES        = ["ACTIVE", "PUBLISHED", "APPROVED", "DRAFT"] as const;

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
        status: { in: [...PLAYABLE_AD_STATUSES] },
        campaign: {
          status:    { in: [...PLAYABLE_CAMPAIGN_STATUSES] },
          startDate: { lte: now },
          endDate:   { gte: now },
        },
      },
    },
    include: {
      ad: {
        include: {
          mediaAsset: {
            select: { url: true, storageKey: true, type: true, mimeType: true, duration: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const items: PlaylistItem[] = [];
  for (const s of schedules) {
    const url = resolveUrl(s.ad.mediaAsset?.url, s.ad.mediaAsset?.storageKey) ?? s.ad.fileUrl ?? null;
    if (!url) continue;
    items.push({
      adId:       s.ad.id,
      scheduleId: s.id,
      title:      s.ad.title,
      url,
      format:     isVideoAd(s.ad) ? "VIDEO" : "IMAGE",
      mimeType:   s.ad.mediaAsset?.mimeType ?? null,
      duration:   s.ad.duration,
    });
  }
  return items;
}

/**
 * Source 2: ads via ScreenCampaign (campaign-level assignment).
 */
async function getScreenCampaignItems(screenId: string, now: Date): Promise<PlaylistItem[]> {
  const assignments = await db.screenCampaign.findMany({
    where: {
      screenId,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      campaign: {
        status:    { in: [...PLAYABLE_CAMPAIGN_STATUSES] },
        startDate: { lte: now },
        endDate:   { gte: now },
      },
    },
    include: {
      campaign: {
        include: {
          ads: {
            where: { status: { in: [...PLAYABLE_AD_STATUSES] } },
            include: {
              mediaAsset: {
                select: { url: true, storageKey: true, type: true, mimeType: true, duration: true },
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
      const url = resolveUrl(ad.mediaAsset?.url, ad.mediaAsset?.storageKey) ?? ad.fileUrl ?? null;
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
