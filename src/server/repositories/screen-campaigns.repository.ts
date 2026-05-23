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
 * Pass organizationId to validate campaign ownership (regular users).
 * Pass null to skip org validation (platform staff cross-org assignment).
 * Returns the count of assignments after the operation.
 */
export async function replaceScreenCampaigns(
  screenId: string,
  campaignIds: string[],
  organizationId: string | null,
): Promise<number> {
  // Guard: validate org ownership unless platform staff (null = skip)
  let validIds: string[];
  if (organizationId !== null && campaignIds.length > 0) {
    const validCampaigns = await db.campaign.findMany({
      where: { id: { in: campaignIds }, organizationId },
      select: { id: true },
    });
    validIds = validCampaigns.map((c) => c.id);
  } else {
    validIds = campaignIds;
  }

  await db.$transaction(async (tx) => {
    await tx.screenCampaign.deleteMany({ where: { screenId } });
    if (validIds.length > 0) {
      await tx.screenCampaign.createMany({
        data: validIds.map((campaignId, i) => ({
          screenId,
          campaignId,
          isActive: true,
          priority: validIds.length - i,
        })),
        skipDuplicates: true,
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
