"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { getRole } from "@/lib/auth";
import { logAudit } from "@/actions/audit";

const ADMIN_ROLES = new Set(["ADMIN", "EXECUTIVE"] as const);

async function loadOrgCampaign(orgId: string, campaignId: string) {
  return db.campaign.findFirst({
    where: { id: campaignId, organizationId: orgId },
    select: { id: true, status: true, organizationId: true },
  });
}

export async function createCampaign(formData: FormData) {
  const ctx = await requireOrgContext();
  const role = await getRole();

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

  const clientOk = await db.client.findFirst({
    where: { id: clientId, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!clientOk) throw new Error("Cliente no pertenece a esta organización");

  const isAdmin = role !== null && ADMIN_ROLES.has(role as "ADMIN" | "EXECUTIVE");
  const status = isAdmin ? "DRAFT" : "PENDING_APPROVAL";

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
      status,
    },
  });

  await logAudit({
    action: "campaign.create",
    entityType: "Campaign",
    entityId: campaign.id,
    metadata: { name, status },
  });

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");

  return { id: campaign.id, status };
}

export async function approveCampaign(campaignId: string) {
  const ctx = await requireOrgContext();
  const role = await getRole();

  if (!role || !ADMIN_ROLES.has(role as "ADMIN" | "EXECUTIVE")) {
    throw new Error("Solo administradores pueden aprobar campañas");
  }

  const campaign = await loadOrgCampaign(ctx.organizationId, campaignId);
  if (!campaign) throw new Error("Campaña no encontrada");
  if (campaign.status !== "PENDING_APPROVAL") throw new Error("La campaña no está pendiente de aprobación");

  await db.campaign.update({
    where: { id: campaignId },
    data: { status: "APPROVED" },
  });

  await logAudit({
    action: "campaign.approve",
    entityType: "Campaign",
    entityId: campaignId,
    metadata: { from: "PENDING_APPROVAL", to: "APPROVED" },
  });

  revalidatePath("/approvals");
  revalidatePath("/campaigns");
  revalidatePath("/ads");

  return { success: true };
}

export async function rejectCampaign(campaignId: string, reason?: string) {
  const ctx = await requireOrgContext();
  const role = await getRole();

  if (!role || !ADMIN_ROLES.has(role as "ADMIN" | "EXECUTIVE")) {
    throw new Error("Solo administradores pueden rechazar campañas");
  }

  const campaign = await loadOrgCampaign(ctx.organizationId, campaignId);
  if (!campaign) throw new Error("Campaña no encontrada");
  if (campaign.status !== "PENDING_APPROVAL") throw new Error("La campaña no está pendiente de aprobación");

  await db.campaign.update({
    where: { id: campaignId },
    data: { status: "REJECTED" },
  });

  await logAudit({
    action: "campaign.reject",
    entityType: "Campaign",
    entityId: campaignId,
    metadata: { from: "PENDING_APPROVAL", to: "REJECTED", reason: reason ?? "" },
  });

  revalidatePath("/approvals");
  revalidatePath("/campaigns");

  return { success: true };
}

export async function updateCampaignStatus(campaignId: string, status: string) {
  const ctx = await requireOrgContext();

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

  const campaign = await loadOrgCampaign(ctx.organizationId, campaignId);
  if (!campaign) throw new Error("Campaña no encontrada");

  await db.campaign.delete({ where: { id: campaignId } });
  await logAudit({ action: "campaign.delete", entityType: "Campaign", entityId: campaignId });

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");

  return { success: true, redirect: "/campaigns" };
}
