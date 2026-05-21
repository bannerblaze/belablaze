"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { db } from "@/lib/db";
import { logAudit } from "@/actions/audit";
import {
  replaceScreenCampaigns,
  removeScreenCampaign,
} from "@/server/repositories/screen-campaigns.repository";

/* ──────────────────────────────────────────────────────────────────────
 * Screen ↔ Campaign assignment actions.
 *
 * All mutations:
 *   1. requireOrgContext() — authenticated, org-scoped
 *   2. Validate the screen belongs to the caller's org
 *   3. Delegate to repository (which also validates campaign ownership)
 *   4. Audit + revalidate
 * ────────────────────────────────────────────────────────────────────── */

async function assertScreenOwnership(screenId: string, orgId: string) {
  const screen = await db.screen.findFirst({
    where: { id: screenId, organizationId: orgId },
    select: { id: true, name: true },
  });
  if (!screen) throw new Error("Pantalla no encontrada");
  return screen;
}

/**
 * Replaces all campaign assignments for a screen with the given list.
 * Passing an empty array removes all assignments.
 */
export async function assignCampaignsToScreen(
  screenId: string,
  campaignIds: string[],
) {
  const ctx = await requireOrgContext();
  const screen = await assertScreenOwnership(screenId, ctx.organizationId);

  const count = await replaceScreenCampaigns(screenId, campaignIds, ctx.organizationId);

  await logAudit({
    action:     "screen.campaigns.assign",
    entityType: "Screen",
    entityId:   screenId,
    metadata:   { screenName: screen.name, campaignCount: count, campaignIds },
  });

  revalidatePath("/screens");
  revalidatePath("/dashboard");
  return { success: true, count };
}

/** Removes a single campaign from a screen's assignment list. */
export async function removeCampaignFromScreen(
  screenId: string,
  campaignId: string,
) {
  const ctx = await requireOrgContext();
  const screen = await assertScreenOwnership(screenId, ctx.organizationId);

  await removeScreenCampaign(screenId, campaignId, ctx.organizationId);

  await logAudit({
    action:     "screen.campaigns.remove",
    entityType: "Screen",
    entityId:   screenId,
    metadata:   { screenName: screen.name, campaignId },
  });

  revalidatePath("/screens");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Returns campaigns available for assignment to a screen.
 * Used by the AssignCampaignsModal to populate the picker list.
 */
export async function getOrgCampaignsForAssignment() {
  const ctx = await requireOrgContext();

  const campaigns = await db.campaign.findMany({
    where: { organizationId: ctx.organizationId },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      client: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return campaigns.map((c) => ({
    id:        c.id,
    name:      c.name,
    status:    c.status,
    startDate: c.startDate.toISOString(),
    endDate:   c.endDate.toISOString(),
    client:    c.client,
  }));
}
