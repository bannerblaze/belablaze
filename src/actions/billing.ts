"use server";

import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/actions/audit";
import type { PlanTier } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Billing actions — no Stripe yet. Track usage and expose plan limits.
 * Constants live in `src/lib/plans.ts` so client UI can import them
 * directly without violating the "use server" export rule.
 * ────────────────────────────────────────────────────────────────────── */

export async function getCurrentSubscription() {
  const ctx = await requireOrgContext();
  let sub = await db.subscription.findUnique({ where: { organizationId: ctx.organizationId } });
  if (!sub) {
    sub = await db.subscription.create({
      data: {
        organizationId: ctx.organizationId,
        plan: "STARTER",
        status: "TRIALING",
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      },
    });
  }
  return sub;
}

export async function getUsage() {
  const ctx = await requireOrgContext();
  const [campaigns, screens, members, media] = await Promise.all([
    db.campaign.count({ where: { organizationId: ctx.organizationId } }),
    db.screen.count({ where: { organizationId: ctx.organizationId } }),
    db.organizationMember.count({ where: { organizationId: ctx.organizationId } }),
    db.mediaAsset.aggregate({
      where: { organizationId: ctx.organizationId, isArchived: false },
      _sum: { size: true },
      _count: true,
    }),
  ]);
  return {
    campaigns,
    screens,
    members,
    mediaAssets: media._count,
    storageMB: Math.round(((media._sum.size ?? 0) / 1024 / 1024) * 10) / 10,
  };
}

type Result = { ok: true } | { ok: false; error: string };

export async function setPlan(plan: PlanTier): Promise<Result> {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "billing:manage");

  await db.$transaction([
    db.organization.update({ where: { id: ctx.organizationId }, data: { plan } }),
    db.subscription.upsert({
      where: { organizationId: ctx.organizationId },
      create: {
        organizationId: ctx.organizationId,
        plan,
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
      update: { plan, status: "ACTIVE" },
    }),
  ]);

  await logAudit({ action: "billing.update_plan", entityType: "Subscription", metadata: { plan } });
  return { ok: true };
}
