"use server";

import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";

/* ──────────────────────────────────────────────────────────────────────
 * Billing — minimal surface.
 *
 * The product no longer has plan tiers / feature flags / limits.
 * What we still expose:
 *
 *   - getCurrentSubscription(): the row that records when this org
 *     joined and its subscription status. Used by the billing page
 *     to render contact / status info; not used to gate anything.
 *
 *   - getUsage(): live counts of resources for the dashboard widget
 *     (campaigns / screens / members / media / storage). Pure read.
 *
 * No plan grid, no tier comparison, no setPlan action — those have
 * all been removed.
 * ────────────────────────────────────────────────────────────────────── */

export async function getCurrentSubscription() {
  const ctx = await requireOrgContext();
  let sub = await db.subscription.findUnique({ where: { organizationId: ctx.organizationId } });
  if (!sub) {
    sub = await db.subscription.create({
      data: {
        organizationId: ctx.organizationId,
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      },
    });
  }
  return sub;
}

export async function getUsage() {
  const ctx = await requireOrgContext();
  const [campaigns, screens, media] = await Promise.all([
    db.campaign.count({ where: { organizationId: ctx.organizationId } }),
    db.screen.count({ where: { organizationId: ctx.organizationId } }),
    db.mediaAsset.aggregate({
      where: { organizationId: ctx.organizationId, isArchived: false },
      _sum: { size: true },
      _count: true,
    }),
  ]);
  return {
    campaigns,
    screens,
    mediaAssets: media._count,
    storageMB: Math.round(((media._sum.size ?? 0) / 1024 / 1024) * 10) / 10,
  };
}
