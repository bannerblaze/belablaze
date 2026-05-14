"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/actions/audit";

/* ──────────────────────────────────────────────────────────────────────
 * Tenant-scoped ad approval mutations.
 *
 * Ads belong to campaigns, and campaigns carry organizationId. So
 * approval/rejection is gated by:
 *   1. requireOrgContext() — caller has an active org
 *   2. assertCan("ads:approve") — OrgRole has the approve permission
 *   3. loadOrgAd() — the ad's parent campaign belongs to the same org
 *
 * Without step 3, a moderator from Org A could approve Org B's ads
 * by guessing IDs.
 * ────────────────────────────────────────────────────────────────────── */

async function loadOrgAd(orgId: string, adId: string) {
  return db.ad.findFirst({
    where: { id: adId, campaign: { organizationId: orgId } },
    select: { id: true, status: true, title: true },
  });
}

export async function approveAd(adId: string) {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "ads:approve");

  const ad = await loadOrgAd(ctx.organizationId, adId);
  if (!ad) throw new Error("Anuncio no encontrado");

  await db.$transaction([
    db.ad.update({ where: { id: adId }, data: { status: "APPROVED" } }),
    db.adApproval.create({ data: { adId, userId: ctx.userId, approved: true } }),
  ]);

  await logAudit({
    action: "ad.approve",
    entityType: "Ad",
    entityId: adId,
    metadata: { title: ad.title, from: ad.status },
  });

  revalidatePath("/approvals");
  revalidatePath("/ads");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rejectAd(adId: string, note: string) {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "ads:approve");

  const trimmed = note.trim();
  if (!trimmed) throw new Error("El motivo de rechazo es obligatorio");

  const ad = await loadOrgAd(ctx.organizationId, adId);
  if (!ad) throw new Error("Anuncio no encontrado");

  await db.$transaction([
    db.ad.update({ where: { id: adId }, data: { status: "REJECTED", rejectionNote: trimmed } }),
    db.adApproval.create({ data: { adId, userId: ctx.userId, approved: false, note: trimmed } }),
  ]);

  await logAudit({
    action: "ad.reject",
    entityType: "Ad",
    entityId: adId,
    metadata: { title: ad.title, from: ad.status, note: trimmed },
  });

  revalidatePath("/approvals");
  revalidatePath("/ads");
  revalidatePath("/dashboard");
  return { success: true };
}
