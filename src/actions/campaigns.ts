"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, role: true } });
  if (!user) throw new Error("Usuario no encontrado en base de datos");
  return user;
}

export async function createCampaign(formData: FormData) {
  const user = await getDbUser();

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

  const campaign = await db.campaign.create({
    data: {
      name,
      description,
      clientId,
      userId: user.id,
      budget,
      startDate,
      endDate,
      targetCities,
      status: "DRAFT",
    },
  });

  await db.log.create({
    data: {
      userId: user.id,
      action: "CREATE",
      entity: "Campaign",
      entityId: campaign.id,
      newData: { name },
    },
  });

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  redirect(`/campaigns/${campaign.id}`);
}

export async function updateCampaignStatus(campaignId: string, status: string) {
  const user = await getDbUser();

  const campaign = await db.campaign.findUnique({ where: { id: campaignId }, select: { status: true } });
  if (!campaign) throw new Error("Campaña no encontrada");

  await db.campaign.update({
    where: { id: campaignId },
    data: { status: status as Parameters<typeof db.campaign.update>[0]["data"]["status"] },
  });

  await db.log.create({
    data: {
      userId: user.id,
      action: status === "PAUSED" ? "PAUSE" : "UPDATE",
      entity: "Campaign",
      entityId: campaignId,
      oldData: { status: campaign.status },
      newData: { status },
    },
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
  const user = await getDbUser();

  const campaign = await db.campaign.findUnique({ where: { id: campaignId }, select: { status: true } });
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

  await db.log.create({
    data: { userId: user.id, action: "UPDATE", entity: "Campaign", entityId: campaignId, newData: data },
  });

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteCampaign(campaignId: string) {
  const user = await getDbUser();
  if (user.role !== "ADMIN") throw new Error("Sin permisos");

  await db.campaign.delete({ where: { id: campaignId } });
  await db.log.create({
    data: { userId: user.id, action: "DELETE", entity: "Campaign", entityId: campaignId },
  });

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  redirect("/campaigns");
}
