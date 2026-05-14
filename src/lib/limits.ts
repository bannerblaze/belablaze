import "server-only";

import { db } from "@/lib/db";
import {
  PLANS, hasFeature, getLimit, isAtLimit,
  type PlanFeature, type PlanLimits,
} from "@/lib/plans";
import { getCurrentUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform";
import type { PlanTier } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Runtime plan enforcement.
 *
 * Every "create X" path on the server calls assertWithinLimit() before
 * touching the database. Feature-gated routes (api-keys, webhooks, SSO,
 * advanced analytics) call assertHasFeature().
 *
 * Errors thrown here are typed (PlanLimitError / FeatureGateError) so
 * server actions and API handlers can render upgrade prompts instead of
 * generic 500s.
 *
 * Plans + limits constants live in src/lib/plans.ts (framework-free).
 * This file owns the "current usage" queries against Prisma.
 * ────────────────────────────────────────────────────────────────────── */

export type LimitedResource = keyof PlanLimits;

export class PlanLimitError extends Error {
  constructor(
    public readonly resource: LimitedResource,
    public readonly used: number,
    public readonly max: number,
    public readonly plan: PlanTier,
  ) {
    super(`Límite del plan alcanzado: ${resource} (${used}/${max} en ${plan}).`);
    this.name = "PlanLimitError";
  }
}

export class FeatureGateError extends Error {
  constructor(public readonly feature: PlanFeature, public readonly plan: PlanTier) {
    super(`La función "${feature}" no está disponible en el plan ${plan}.`);
    this.name = "FeatureGateError";
  }
}

/** Resolves the plan for an org (FREE when no Subscription row exists yet). */
export async function getOrgPlan(organizationId: string): Promise<PlanTier> {
  const sub = await db.subscription.findUnique({
    where: { organizationId },
    select: { plan: true, status: true },
  });
  if (!sub) return "FREE";
  // CANCELED subscriptions revert to FREE so the user keeps read access
  // but can't create new resources beyond Free limits.
  if (sub.status === "CANCELED") return "FREE";
  return sub.plan;
}

/** Live count of every limited resource for a given org. */
export async function getOrgUsage(organizationId: string): Promise<Record<LimitedResource, number>> {
  const [campaigns, screens, members, pendingInvites, mediaCount, mediaSize, ownedOrgs] = await Promise.all([
    db.campaign.count({ where: { organizationId } }),
    db.screen.count({ where: { organizationId } }),
    db.organizationMember.count({ where: { organizationId } }),
    db.invitation.count({ where: { organizationId, status: "PENDING" } }),
    db.mediaAsset.count({ where: { organizationId, isArchived: false } }),
    db.mediaAsset.aggregate({
      where: { organizationId, isArchived: false },
      _sum: { size: true },
    }),
    // Reuse this query so the same shape can power the "max organizations
    // per user" check from createOrganization. Caller passes ownerId via
    // getOrgsOwnedBy() below — this default usage just counts the org
    // itself relative to its own membership.
    db.organization.count({ where: { id: organizationId } }),
  ]);

  return {
    campaigns,
    screens,
    // Pending invites count toward the seat limit so a Free org can't
    // pre-invite 50 people and then upgrade-after-the-fact.
    members: members + pendingInvites,
    mediaAssets: mediaCount,
    storageMB: Math.round(((mediaSize._sum.size ?? 0) / 1024 / 1024) * 10) / 10,
    organizations: ownedOrgs,
  };
}

/** Cross-org check: how many orgs is this user the OWNER of? */
export async function getOrgsOwnedBy(userId: string): Promise<number> {
  return db.organizationMember.count({
    where: { userId, role: "OWNER" },
  });
}

export type LimitCheck = {
  resource: LimitedResource;
  plan: PlanTier;
  used: number;
  max: number;
  remaining: number;
  /** True when the next create would exceed the cap. */
  atLimit: boolean;
};

/** Soft check — returns the snapshot without throwing. */
export async function checkLimit(
  organizationId: string,
  resource: LimitedResource,
): Promise<LimitCheck> {
  const [plan, usage] = await Promise.all([
    getOrgPlan(organizationId),
    getOrgUsage(organizationId),
  ]);
  const used = usage[resource];
  const max = getLimit(plan, resource);
  return {
    resource,
    plan,
    used,
    max,
    remaining: Math.max(0, max - used),
    atLimit: isAtLimit(plan, resource, used),
  };
}

/** Hard check — throws PlanLimitError when creating one more would exceed.
 *  Platform super admins (admin@bannerblaze.com, ceo@bannerblaze.com, env
 *  whitelist) bypass the cap entirely so they can operate any tenant for
 *  support/incident work. */
export async function assertWithinLimit(
  organizationId: string,
  resource: LimitedResource,
): Promise<LimitCheck> {
  const snap = await checkLimit(organizationId, resource);
  if (snap.atLimit) {
    const me = await getCurrentUser();
    if (!isPlatformAdmin(me)) {
      throw new PlanLimitError(resource, snap.used, snap.max, snap.plan);
    }
  }
  return snap;
}

/** Storage uses a numeric headroom check (megabytes). */
export async function assertStorageHeadroom(
  organizationId: string,
  additionalBytes: number,
): Promise<{ plan: PlanTier; usedMB: number; maxMB: number }> {
  const plan = await getOrgPlan(organizationId);
  const max = getLimit(plan, "storageMB");
  const sum = await db.mediaAsset.aggregate({
    where: { organizationId, isArchived: false },
    _sum: { size: true },
  });
  const currentBytes = sum._sum.size ?? 0;
  const projectedMB = (currentBytes + additionalBytes) / 1024 / 1024;
  if (max < 9999 && projectedMB > max) {
    const me = await getCurrentUser();
    if (!isPlatformAdmin(me)) {
      throw new PlanLimitError(
        "storageMB",
        Math.round(projectedMB),
        max,
        plan,
      );
    }
  }
  return { plan, usedMB: Math.round(currentBytes / 1024 / 1024), maxMB: max };
}

/** Throws FeatureGateError if the org's plan doesn't include the feature.
 *  Platform super admins bypass the gate. */
export async function assertHasFeature(
  organizationId: string,
  feature: PlanFeature,
): Promise<PlanTier> {
  const plan = await getOrgPlan(organizationId);
  if (!hasFeature(plan, feature)) {
    const me = await getCurrentUser();
    if (!isPlatformAdmin(me)) {
      throw new FeatureGateError(feature, plan);
    }
  }
  return plan;
}

/** Soft variant for UI gating. */
export async function orgHasFeature(
  organizationId: string,
  feature: PlanFeature,
): Promise<boolean> {
  const plan = await getOrgPlan(organizationId);
  return hasFeature(plan, feature);
}

/**
 * Combined gate used by enterprise-only settings pages (API Keys,
 * Webhooks, Branding, Audit Log). Returns the route the caller should
 * redirect to when blocked, or null when access is allowed.
 *
 *   - SUPER_ADMIN: always allowed.
 *   - PERSON (creator) account: blocked → /dashboard.
 *   - Plan missing the feature: blocked → /settings/billing.
 */
export async function checkEnterpriseAccess(
  organizationId: string,
  feature: PlanFeature,
): Promise<string | null> {
  const me = await getCurrentUser();
  if (isPlatformAdmin(me)) return null;

  const accountType = me?.accountType;
  if (accountType !== "ORGANIZATION" && accountType !== "INTERNAL") {
    return "/dashboard";
  }

  const plan = await getOrgPlan(organizationId);
  if (!hasFeature(plan, feature)) {
    return "/settings/billing";
  }
  return null;
}

/** Helper for /settings/billing and the dashboard usage card — single query. */
export async function getUsageSnapshot(organizationId: string): Promise<{
  plan: PlanTier;
  usage: Record<LimitedResource, number>;
  limits: PlanLimits;
}> {
  const [plan, usage] = await Promise.all([
    getOrgPlan(organizationId),
    getOrgUsage(organizationId),
  ]);
  return {
    plan,
    usage,
    limits: PLANS[plan].limits,
  };
}
