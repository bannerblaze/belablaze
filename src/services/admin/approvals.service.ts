import "server-only";
import { db } from "@/lib/db";
import { isPlatformStaffSession } from "@/lib/access";

/* ──────────────────────────────────────────────────────────────────────
 * Admin approvals service — INTERNAL-only.
 *
 * Powers the /approvals moderation panel. Returns ads across ALL
 * organizations (no org-scope filter). Every function calls
 * isPlatformStaffSession() first.
 *
 * Returns plain JSON-serializable shapes for streaming into client
 * components.
 * ────────────────────────────────────────────────────────────────────── */

export interface ModerationAd {
  id: string;
  title: string;
  description: string | null;
  status: string;
  format: string;
  duration: number;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  qrEnabled: boolean;
  qrUrl: string | null;
  rejectionNote: string | null;
  startDate: string | null;
  endDate: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  campaign: {
    id: string;
    name: string;
  } | null;
  org: {
    id: string;
    name: string;
    slug: string;
  } | null;
  ownerEmail: string | null;
  ownerName: string | null;
}

export interface ModerationOverview {
  totalPending: number;
  approvedToday: number;
  rejectedToday: number;
  publishedToday: number;
  publishedTotal: number;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const AD_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  format: true,
  duration: true,
  fileUrl: true,
  thumbnailUrl: true,
  ctaText: true,
  ctaUrl: true,
  qrEnabled: true,
  qrUrl: true,
  rejectionNote: true,
  startDate: true,
  endDate: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  campaign: {
    select: {
      id: true,
      name: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          owner: { select: { email: true, name: true } },
        },
      },
    },
  },
} as const;

function serializeAd(a: {
  id: string; title: string; description: string | null; status: string; format: string;
  duration: number; fileUrl: string | null; thumbnailUrl: string | null;
  ctaText: string | null; ctaUrl: string | null; qrEnabled: boolean; qrUrl: string | null;
  rejectionNote: string | null; startDate: Date | null; endDate: Date | null;
  submittedAt: Date | null; reviewedAt: Date | null; reviewedBy: string | null;
  publishedAt: Date | null; createdAt: Date; updatedAt: Date;
  campaign: {
    id: string; name: string;
    organization: {
      id: string; name: string; slug: string;
      owner: { email: string; name: string };
    } | null;
  } | null;
}): ModerationAd {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    status: a.status,
    format: a.format,
    duration: a.duration,
    fileUrl: a.fileUrl,
    thumbnailUrl: a.thumbnailUrl,
    ctaText: a.ctaText,
    ctaUrl: a.ctaUrl,
    qrEnabled: a.qrEnabled,
    qrUrl: a.qrUrl,
    rejectionNote: a.rejectionNote,
    startDate: a.startDate?.toISOString() ?? null,
    endDate: a.endDate?.toISOString() ?? null,
    submittedAt: a.submittedAt?.toISOString() ?? null,
    reviewedAt: a.reviewedAt?.toISOString() ?? null,
    reviewedBy: a.reviewedBy,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    campaign: a.campaign ? { id: a.campaign.id, name: a.campaign.name } : null,
    org: a.campaign?.organization
      ? { id: a.campaign.organization.id, name: a.campaign.organization.name, slug: a.campaign.organization.slug }
      : null,
    ownerEmail: a.campaign?.organization?.owner.email ?? null,
    ownerName: a.campaign?.organization?.owner.name ?? null,
  };
}

export async function getModerationOverview(): Promise<ModerationOverview | null> {
  if (!(await isPlatformStaffSession())) return null;

  const today = startOfToday();
  const [totalPending, approvedToday, rejectedToday, publishedToday, publishedTotal] =
    await Promise.all([
      db.ad.count({ where: { status: "PENDING_REVIEW" } }),
      db.ad.count({ where: { status: "APPROVED", reviewedAt: { gte: today } } }),
      db.ad.count({ where: { status: "REJECTED", reviewedAt: { gte: today } } }),
      db.ad.count({ where: { status: "PUBLISHED", publishedAt: { gte: today } } }),
      db.ad.count({ where: { status: "PUBLISHED" } }),
    ]);

  return { totalPending, approvedToday, rejectedToday, publishedToday, publishedTotal };
}

export async function getPendingAds(): Promise<ModerationAd[]> {
  if (!(await isPlatformStaffSession())) return [];

  const ads = await db.ad.findMany({
    where: { status: "PENDING_REVIEW" },
    select: AD_SELECT,
    orderBy: { submittedAt: "asc" },
    take: 100,
  });

  return ads.map(serializeAd);
}

export async function getReviewedAds(status: "APPROVED" | "REJECTED" | "PUBLISHED"): Promise<ModerationAd[]> {
  if (!(await isPlatformStaffSession())) return [];

  const ads = await db.ad.findMany({
    where: { status },
    select: AD_SELECT,
    orderBy: { reviewedAt: "desc" },
    take: 50,
  });

  return ads.map(serializeAd);
}
