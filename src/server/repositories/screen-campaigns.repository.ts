import { db } from "@/lib/db";

/* ──────────────────────────────────────────────────────────────────────
 * ScreenCampaign repository — data-access layer for screen↔campaign
 * assignments. All writes validate org ownership before touching data.
 * ────────────────────────────────────────────────────────────────────── */

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
  };
};

/** Returns all active campaign assignments for a screen. */
export async function getScreenCampaigns(
  screenId: string,
  organizationId: string,
): Promise<AssignedCampaign[]> {
  const rows = await db.screenCampaign.findMany({
    where: {
      screenId,
      screen: { organizationId },
    },
    include: {
      campaign: {
        select: {
          id: true, name: true, status: true,
          startDate: true, endDate: true,
          client: { select: { name: true } },
        },
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });

  return rows.map((r) => ({
    id:         r.id,
    campaignId: r.campaignId,
    priority:   r.priority,
    isActive:   r.isActive,
    startsAt:   r.startsAt?.toISOString() ?? null,
    endsAt:     r.endsAt?.toISOString()   ?? null,
    campaign: {
      id:        r.campaign.id,
      name:      r.campaign.name,
      status:    r.campaign.status,
      startDate: r.campaign.startDate.toISOString(),
      endDate:   r.campaign.endDate.toISOString(),
      client:    r.campaign.client,
    },
  }));
}

/**
 * Replaces all assignments for a screen with the given campaign IDs.
 * Validates that every campaignId belongs to the org before writing.
 * Returns the count of assignments after the operation.
 */
export async function replaceScreenCampaigns(
  screenId: string,
  campaignIds: string[],
  organizationId: string,
): Promise<number> {
  // Guard: all campaigns must belong to org
  const validCampaigns = campaignIds.length > 0
    ? await db.campaign.findMany({
        where: { id: { in: campaignIds }, organizationId },
        select: { id: true },
      })
    : [];

  const validIds = validCampaigns.map((c) => c.id);

  await db.$transaction(async (tx) => {
    await tx.screenCampaign.deleteMany({ where: { screenId } });
    if (validIds.length > 0) {
      await tx.screenCampaign.createMany({
        data: validIds.map((campaignId) => ({
          screenId,
          campaignId,
          isActive: true,
          priority: 0,
        })),
      });
    }
  });

  return validIds.length;
}

/** Removes a single campaign assignment from a screen. */
export async function removeScreenCampaign(
  screenId: string,
  campaignId: string,
  organizationId: string,
): Promise<boolean> {
  const result = await db.screenCampaign.deleteMany({
    where: {
      screenId,
      campaignId,
      screen: { organizationId },
    },
  });
  return result.count > 0;
}
