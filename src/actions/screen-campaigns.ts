"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { getCurrentUser } from "@/lib/auth";
import { isPlatformStaff } from "@/lib/platform";
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
  const user = await getCurrentUser();
  const staff = isPlatformStaff(user);
  const screen = await assertScreenOwnership(screenId, ctx.organizationId);

  // Platform staff can cross-assign campaigns from any organization.
  const count = await replaceScreenCampaigns(
    screenId,
    campaignIds,
    staff ? null : ctx.organizationId,
  );

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
 * Platform staff see ALL campaigns across every organization.
 * Regular users see only their own org's campaigns.
 */
export async function getOrgCampaignsForAssignment() {
  const ctx = await requireOrgContext();
  const user = await getCurrentUser();
  const staff = isPlatformStaff(user);

  const campaigns = await db.campaign.findMany({
    where: staff ? {} : { organizationId: ctx.organizationId },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      client: { select: { name: true } },
      organization: { select: { name: true } },
      user: { select: { name: true, email: true } },
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
    orgName:   c.organization?.name ?? null,
    createdBy: c.user?.name ?? c.user?.email ?? null,
  }));
}
