"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { assertCan } from "@/lib/rbac";
import { assertWithinLimit } from "@/lib/limits";
import { logAudit } from "@/actions/audit";

/* ──────────────────────────────────────────────────────────────────────
 * Tenant-scoped campaign mutations.
 *
 * Every action calls requireOrgContext() + assertCan() so that:
 *   • A user can only mutate campaigns inside their active organization
 *   • The RBAC matrix (src/lib/rbac.ts) decides which role can do what
 *   • Audit log captures actor, org, action, entity for every change
 * ────────────────────────────────────────────────────────────────────── */

async function loadOrgCampaign(orgId: string, campaignId: string) {
  return db.campaign.findFirst({
    where: { id: campaignId, organizationId: orgId },
    select: { id: true, status: true, organizationId: true },
  });
}

export async function createCampaign(formData: FormData) {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "campaigns:create");
  await assertWithinLimit(ctx.organizationId, "campaigns");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const clientId = formData.get("clientId") as string;
  const budget = parseFloat(formData.get("budget") as string);
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);
  const targetCities = (formData.get("targetCities") as string).split(",").map((c) => c.trim()).filter(Boolean);

  if (!name || !clientId || isNaN(budget) || !startDate || !endDate) {
    throw new Error("Datos incompletos");
  }

  // Client must belong to the same org — defend against cross-tenant ID guessing.
  const clientOk = await db.client.findFirst({
    where: { id: clientId, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!clientOk) throw new Error("Cliente no pertenece a esta organización");

  const campaign = await db.campaign.create({
    data: {
      name,
      description,
      clientId,
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      budget,
      startDate,
      endDate,
      targetCities,
      status: "DRAFT",
    },
  });

  await logAudit({ action: "campaign.create", entityType: "Campaign", entityId: campaign.id, metadata: { name } });

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  redirect(`/campaigns/${campaign.id}`);
}

export async function updateCampaignStatus(campaignId: string, status: string) {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "campaigns:update");

  const campaign = await loadOrgCampaign(ctx.organizationId, campaignId);
  if (!campaign) throw new Error("Campaña no encontrada");

  await db.campaign.update({
    where: { id: campaignId },
    data: { status: status as Parameters<typeof db.campaign.update>[0]["data"]["status"] },
  });

  await logAudit({
    action: status === "PAUSED" ? "campaign.pause" : "campaign.update",
    entityType: "Campaign",
    entityId: campaignId,
    metadata: { from: campaign.status, to: status },
  });

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function updateCampaign(campaignId: string, data: {
  name?: string;
  description?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  targetCities?: string[];
}) {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "campaigns:update");

  const campaign = await loadOrgCampaign(ctx.organizationId, campaignId);
  if (!campaign) throw new Error("Campaña no encontrada");

  await db.campaign.update({
    where: { id: campaignId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.budget !== undefined && { budget: data.budget }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      ...(data.targetCities && { targetCities: data.targetCities }),
    },
  });

  await logAudit({ action: "campaign.update", entityType: "Campaign", entityId: campaignId, metadata: data });

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteCampaign(campaignId: string) {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "campaigns:delete");

  const campaign = await loadOrgCampaign(ctx.organizationId, campaignId);
  if (!campaign) throw new Error("Campaña no encontrada");

  await db.campaign.delete({ where: { id: campaignId } });
  await logAudit({ action: "campaign.delete", entityType: "Campaign", entityId: campaignId });

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  redirect("/campaigns");
}
