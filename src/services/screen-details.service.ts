import "server-only";

import { getOrgContext } from "@/lib/org-context";
import { getCurrentUser } from "@/lib/auth";
import {
  getScreenWithFullData,
  getScreenAuditLog,
  getScreenImpressionsTotal,
  getScreenTrend,
} from "@/server/repositories/screen-details.repository";

const R2_BASE = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

function resolveMediaUrl(
  url: string | null | undefined,
  storageKey: string | null | undefined,
): string | null {
  if (url?.startsWith("http://") || url?.startsWith("https://")) return url;
  if (storageKey && R2_BASE) return `${R2_BASE}/${storageKey}`;
  return url ?? null;
}

const PLAYABLE_CAMPAIGN_STATUSES = new Set(["ACTIVE", "APPROVED", "DRAFT"]);
const PLAYABLE_AD_STATUSES        = new Set(["ACTIVE", "PUBLISHED", "APPROVED", "DRAFT"]);

/* ──────────────────────────────────────────────────────────────────────
 * Public types — safe to pass across the server/client boundary.
 * All Date fields serialized to ISO strings.
 * ────────────────────────────────────────────────────────────────────── */

export type AdItem = {
  id: string;
  title: string;
  status: string;
  format: string;
  duration: number;
  mediaUrl: string | null;
  storageKey: string | null;
};

export type AssignedCampaign = {
  id: string;
  campaignId: string;
  priority: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  campaign: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    client: { name: string } | null;
    ads: AdItem[];
  };
};

export type ScheduleEntry = {
  id: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  isActive: boolean;
  ad: {
    id: string;
    title: string;
    status: string;
    duration: number;
    campaign: { name: string; status: string };
  };
};

export type ScreenMetrics = {
  activeCampaigns: number;
  totalAds: number;
  activeAds: number;
  impressionsTotal: number;
  trend: { date: string; impressions: number }[];
};

export type ActivityEntry = {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { name: string; avatar: string | null } | null;
};

export type NowPlaying = {
  adId: string;
  title: string;
  campaignName: string;
  duration: number;
  source: "schedule" | "campaign";
} | null;

export type ScreenDetailData = {
  id: string;
  name: string;
  slug: string;
  code: string;
  playerKey: string;
  type: string;
  status: string;
  orientation: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  width: number;
  height: number;
  resolutionWidth: number;
  resolutionHeight: number;
  dailyTraffic: number;
  pricePerSecond: number;
  notes: string | null;
  isActive: boolean;
  lastSeenAt: string | null;
  lastPingAt: string | null;
  createdAt: string;
  updatedAt: string;
  campaigns: AssignedCampaign[];
  schedules: ScheduleEntry[];
  metrics: ScreenMetrics;
  activity: ActivityEntry[];
  nowPlaying: NowPlaying;
};

/* ── helpers ─────────────────────────────────────────────────────────── */

function computeNowPlaying(
  campaigns: AssignedCampaign[],
  schedules: ScheduleEntry[],
): NowPlaying {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;

  /* Check time-windowed schedules first */
  const activeSchedule = schedules.find(
    (s) =>
      s.isActive &&
      s.daysOfWeek.includes(dayOfWeek) &&
      s.startTime <= timeStr &&
      s.endTime >= timeStr &&
      PLAYABLE_AD_STATUSES.has(s.ad.status) &&
      PLAYABLE_CAMPAIGN_STATUSES.has(s.ad.campaign.status),
  );

  if (activeSchedule) {
    return {
      adId: activeSchedule.ad.id,
      title: activeSchedule.ad.title,
      campaignName: activeSchedule.ad.campaign.name,
      duration: activeSchedule.ad.duration,
      source: "schedule",
    };
  }

  /* Fall back to highest-priority ScreenCampaign assignment */
  for (const sc of campaigns) {
    if (!sc.isActive) continue;
    if (!PLAYABLE_CAMPAIGN_STATUSES.has(sc.campaign.status)) continue;
    if (sc.startsAt && new Date(sc.startsAt) > now) continue;
    if (sc.endsAt && new Date(sc.endsAt) < now) continue;

    const ad = sc.campaign.ads.find((a) => PLAYABLE_AD_STATUSES.has(a.status));
    if (ad) {
      return {
        adId: ad.id,
        title: ad.title,
        campaignName: sc.campaign.name,
        duration: ad.duration,
        source: "campaign",
      };
    }
  }

  return null;
}

function computeMetrics(
  campaigns: AssignedCampaign[],
  impressionsTotal: number,
): Omit<ScreenMetrics, "trend"> {
  const now = new Date();
  const activeCampaigns = campaigns.filter(
    (sc) =>
      sc.isActive &&
      PLAYABLE_CAMPAIGN_STATUSES.has(sc.campaign.status) &&
      (!sc.startsAt || new Date(sc.startsAt) <= now) &&
      (!sc.endsAt || new Date(sc.endsAt) >= now),
  ).length;

  let totalAds = 0;
  let activeAds = 0;
  for (const sc of campaigns) {
    totalAds += sc.campaign.ads.length;
    activeAds += sc.campaign.ads.filter((a) => PLAYABLE_AD_STATUSES.has(a.status)).length;
  }

  return { activeCampaigns, totalAds, activeAds, impressionsTotal };
}

/* ── public API ──────────────────────────────────────────────────────── */

export async function getScreenDetails(screenId: string): Promise<ScreenDetailData | null> {
  const dbUser = await getCurrentUser().catch(() => null);
  const isInternal = dbUser?.accountType === "INTERNAL";

  let organizationId: string | undefined;
  if (!isInternal) {
    const ctx = await getOrgContext();
    if (!ctx) return null;
    organizationId = ctx.organizationId;
  }

  const [raw, auditLog, impressionsTotal, trend] = await Promise.all([
    getScreenWithFullData(screenId, organizationId),
    getScreenAuditLog(screenId, organizationId),
    getScreenImpressionsTotal(screenId),
    getScreenTrend(screenId, 7),
  ]);

  if (!raw) return null;

  /* Serialize campaigns */
  const campaigns: AssignedCampaign[] = raw.screenCampaigns.map((sc) => ({
    id:         sc.id,
    campaignId: sc.campaignId,
    priority:   sc.priority,
    isActive:   sc.isActive,
    startsAt:   sc.startsAt?.toISOString() ?? null,
    endsAt:     sc.endsAt?.toISOString()   ?? null,
    campaign: {
      id:        sc.campaign.id,
      name:      sc.campaign.name,
      status:    sc.campaign.status,
      startDate: sc.campaign.startDate.toISOString(),
      endDate:   sc.campaign.endDate.toISOString(),
      client:    sc.campaign.client,
      ads: sc.campaign.ads.map((ad) => ({
        id:         ad.id,
        title:      ad.title,
        status:     ad.status,
        format:     ad.format,
        duration:   ad.duration,
        mediaUrl:   resolveMediaUrl(ad.mediaAsset?.url, ad.mediaAsset?.storageKey) ?? ad.fileUrl ?? null,
        storageKey: ad.mediaAsset?.storageKey ?? null,
      })),
    },
  }));

  /* Serialize schedules */
  const schedules: ScheduleEntry[] = raw.adSchedules.map((s) => ({
    id:          s.id,
    startTime:   s.startTime,
    endTime:     s.endTime,
    daysOfWeek:  s.daysOfWeek,
    isActive:    s.isActive,
    ad: {
      id:       s.ad.id,
      title:    s.ad.title,
      status:   s.ad.status,
      duration: s.ad.duration,
      campaign: {
        name:   s.ad.campaign.name,
        status: s.ad.campaign.status,
      },
    },
  }));

  /* Serialize activity */
  const activity: ActivityEntry[] = auditLog.map((log) => ({
    id:        log.id,
    action:    log.action,
    metadata:  log.metadata as Record<string, unknown> | null,
    createdAt: log.createdAt.toISOString(),
    user:      log.user
      ? { name: log.user.name, avatar: log.user.avatar }
      : null,
  }));

  const metrics = { ...computeMetrics(campaigns, impressionsTotal), trend };
  const nowPlaying = computeNowPlaying(campaigns, schedules);

  return {
    id:              raw.id,
    name:            raw.name,
    slug:            raw.slug,
    code:            raw.code,
    playerKey:       raw.playerKey,
    type:            raw.type,
    status:          raw.status,
    orientation:     raw.orientation,
    city:            raw.city,
    address:         raw.address,
    latitude:        raw.latitude,
    longitude:       raw.longitude,
    width:           raw.width,
    height:          raw.height,
    resolutionWidth: raw.resolutionWidth,
    resolutionHeight: raw.resolutionHeight,
    dailyTraffic:    raw.dailyTraffic,
    pricePerSecond:  raw.pricePerSecond,
    notes:           raw.notes,
    isActive:        raw.isActive,
    lastSeenAt:      raw.lastSeenAt?.toISOString()  ?? null,
    lastPingAt:      raw.lastPingAt?.toISOString()  ?? null,
    createdAt:       raw.createdAt.toISOString(),
    updatedAt:       raw.updatedAt.toISOString(),
    campaigns,
    schedules,
    metrics,
    activity,
    nowPlaying,
  };
}
