import "server-only";
import { db } from "@/lib/db";
import { isPlatformStaffSession } from "@/lib/access";
import { ADMIN_WHITELIST } from "@/config/admin-whitelist";

/* ──────────────────────────────────────────────────────────────────────
 * Admin user-management queries — INTERNAL-only.
 *
 * Powers the /clients panel. Every public function calls
 * isPlatformStaffSession() first and returns empty results otherwise,
 * so even if a future caller forgets to gate at the page layer, data
 * doesn't leak.
 *
 * Internal accounts are filtered out of all listings:
 *   • accountType = INTERNAL (BannerBlaze staff)
 *   • email in ADMIN_WHITELIST (admin@bannerblaze.com, etc.)
 *
 * Returns plain JSON-serializable shapes so the page can stream them
 * straight into the client component.
 * ────────────────────────────────────────────────────────────────────── */

export type UserStatusKey = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "NEW";

export interface AdminOverview {
  totalUsers: number;
  totalOrganizations: number;
  totalCreators: number;
  activeToday: number;
  totalCampaigns: number;
  totalStorageMB: number;
}

export interface AdminOrgUser {
  /** Organization id */
  orgId: string;
  /** Organization name (company name from the profile, falls back to org.name) */
  orgName: string;
  slug: string;
  industry: string | null;
  /** Owner id (User) */
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  status: UserStatusKey;
  createdAt: string;
  lastLoginAt: string | null;
  campaignCount: number;
  adCount: number;
  screenCount: number;
  storageMB: number;
}

export interface AdminCreatorUser {
  /** Creator user id */
  userId: string;
  /** Display name from CreatorProfile, falls back to User.name */
  displayName: string;
  email: string;
  category: string | null;
  country: string;
  city: string | null;
  status: UserStatusKey;
  createdAt: string;
  lastLoginAt: string | null;
  /** Org id auto-provisioned during creator onboarding */
  orgId: string | null;
  campaignCount: number;
  adCount: number;
  mediaCount: number;
}

const NEW_USER_DAYS = 7;

function deriveStatus(input: {
  dbStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: Date;
}): UserStatusKey {
  if (input.dbStatus === "SUSPENDED") return "SUSPENDED";
  if (input.dbStatus === "INACTIVE") return "INACTIVE";
  const ageDays = (Date.now() - input.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < NEW_USER_DAYS) return "NEW";
  return "ACTIVE";
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Reusable Prisma `where` clause that hides BannerBlaze-internal accounts. */
const EXCLUDE_INTERNAL = {
  accountType: { not: "INTERNAL" as const },
  email: { notIn: Array.from(ADMIN_WHITELIST) },
};

export async function getAdminOverview(): Promise<AdminOverview | null> {
  if (!(await isPlatformStaffSession())) return null;

  const externalUserWhere = { ...EXCLUDE_INTERNAL };
  const externalOrgWhere = { owner: externalUserWhere };

  const [
    totalUsers,
    totalOrganizations,
    totalCreators,
    activeToday,
    totalCampaigns,
    mediaAgg,
  ] = await Promise.all([
    db.user.count({ where: { ...externalUserWhere, onboardingCompleted: true } }),
    db.organization.count({ where: externalOrgWhere }),
    db.user.count({ where: { ...externalUserWhere, accountType: "PERSON" } }),
    db.user.count({
      where: { ...externalUserWhere, lastLoginAt: { gte: startOfToday() } },
    }),
    db.campaign.count({ where: { organization: externalOrgWhere } }),
    db.mediaAsset.aggregate({
      where: { organization: externalOrgWhere, isArchived: false },
      _sum: { size: true },
    }),
  ]);

  const totalBytes = mediaAgg?._sum?.size ?? 0;
  return {
    totalUsers,
    totalOrganizations,
    totalCreators,
    activeToday,
    totalCampaigns,
    totalStorageMB: Math.round((totalBytes / 1024 / 1024) * 10) / 10,
  };
}

export async function getOrganizationUsers(filters: {
  search?: string;
  status?: UserStatusKey | "ALL";
} = {}): Promise<AdminOrgUser[]> {
  if (!(await isPlatformStaffSession())) return [];

  const orgs = await db.organization.findMany({
    where: {
      owner: { ...EXCLUDE_INTERNAL, accountType: "ORGANIZATION" },
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { owner: { email: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      owner: {
        select: {
          id: true, name: true, email: true, status: true,
          lastLoginAt: true, createdAt: true,
          organizationProfile: { select: { companyName: true, industry: true } },
        },
      },
      _count: { select: { campaigns: true, ads: true, screens: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
  });

  // Per-org storage in a single query
  const mediaSums = await db.mediaAsset.groupBy({
    by: ["organizationId"],
    where: {
      organizationId: { in: orgs.map((o) => o.id) },
      isArchived: false,
    },
    _sum: { size: true },
  });
  const storageByOrg = new Map(
    mediaSums.map((m) => [m.organizationId!, (m._sum.size ?? 0) / 1024 / 1024]),
  );

  const rows: AdminOrgUser[] = orgs.map((o) => ({
    orgId: o.id,
    orgName: o.owner.organizationProfile?.companyName ?? o.name,
    slug: o.slug,
    industry: o.owner.organizationProfile?.industry ?? o.industry ?? null,
    ownerId: o.owner.id,
    ownerName: o.owner.name,
    ownerEmail: o.owner.email,
    status: deriveStatus({ dbStatus: o.owner.status, createdAt: o.owner.createdAt }),
    createdAt: o.createdAt.toISOString(),
    lastLoginAt: o.owner.lastLoginAt?.toISOString() ?? null,
    campaignCount: o._count.campaigns,
    adCount: o._count.ads,
    screenCount: o._count.screens,
    storageMB: Math.round((storageByOrg.get(o.id) ?? 0) * 10) / 10,
  }));

  if (filters.status && filters.status !== "ALL") {
    return rows.filter((r) => r.status === filters.status);
  }
  return rows;
}

export async function getCreatorUsers(filters: {
  search?: string;
  status?: UserStatusKey | "ALL";
} = {}): Promise<AdminCreatorUser[]> {
  if (!(await isPlatformStaffSession())) return [];

  const users = await db.user.findMany({
    where: {
      ...EXCLUDE_INTERNAL,
      accountType: "PERSON",
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
              { creatorProfile: { displayName: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true, name: true, email: true, status: true,
      lastLoginAt: true, createdAt: true, activeOrgId: true,
      creatorProfile: {
        select: { displayName: true, category: true, country: true, city: true },
      },
      ownedOrganizations: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          id: true,
          _count: { select: { campaigns: true, ads: true, mediaAssets: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });

  const rows: AdminCreatorUser[] = users.map((u) => {
    const org = u.ownedOrganizations[0];
    return {
      userId: u.id,
      displayName: u.creatorProfile?.displayName ?? u.name,
      email: u.email,
      category: u.creatorProfile?.category ?? null,
      country: u.creatorProfile?.country ?? "Colombia",
      city: u.creatorProfile?.city ?? null,
      status: deriveStatus({ dbStatus: u.status, createdAt: u.createdAt }),
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      orgId: org?.id ?? null,
      campaignCount: org?._count.campaigns ?? 0,
      adCount: org?._count.ads ?? 0,
      mediaCount: org?._count.mediaAssets ?? 0,
    };
  });

  if (filters.status && filters.status !== "ALL") {
    return rows.filter((r) => r.status === filters.status);
  }
  return rows;
}
