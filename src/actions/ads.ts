"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function getDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, role: true } });
  if (!user) throw new Error("Usuario no encontrado");
  return user;
}

export async function createAd(formData: FormData) {
  const user = await getDbUser();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const campaignId = formData.get("campaignId") as string;
  const format = formData.get("format") as string;
  const duration = parseInt(formData.get("duration") as string) || 15;
  const ctaText = formData.get("ctaText") as string;
  const ctaUrl = formData.get("ctaUrl") as string;
  const qrEnabled = formData.get("qrEnabled") === "true";

  const ad = await db.ad.create({
    data: {
      title,
      description,
      campaignId,
      format: format as Parameters<typeof db.ad.create>[0]["data"]["format"],
      duration,
      ctaText,
      ctaUrl,
      qrEnabled,
      status: "DRAFT",
    },
  });

  await db.log.create({
    data: { userId: user.id, action: "CREATE", entity: "Ad", entityId: ad.id, newData: { title } },
  });

  revalidatePath("/ads");
  return { success: true, id: ad.id };
}

export async function submitAdForReview(adId: string) {
  const user = await getDbUser();

  await db.ad.update({ where: { id: adId }, data: { status: "PENDING_REVIEW" } });
  await db.log.create({
    data: { userId: user.id, action: "UPDATE", entity: "Ad", entityId: adId, newData: { status: "PENDING_REVIEW" } },
  });

  revalidatePath("/ads");
  revalidatePath("/approvals");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function updateAdStatus(adId: string, status: "ACTIVE" | "PAUSED" | "DRAFT") {
  const user = await getDbUser();

  await db.ad.update({ where: { id: adId }, data: { status } });
  await db.log.create({
    data: { userId: user.id, action: status === "PAUSED" ? "PAUSE" : "UPDATE", entity: "Ad", entityId: adId, newData: { status } },
  });

  revalidatePath("/ads");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteAd(adId: string) {
  const user = await getDbUser();

  const ad = await db.ad.findUnique({ where: { id: adId }, select: { title: true, status: true } });
  if (!ad) throw new Error("Anuncio no encontrado");

  if (ad.status === "ACTIVE" && user.role !== "ADMIN") {
    throw new Error("No puedes eliminar un anuncio activo");
  }

  await db.ad.delete({ where: { id: adId } });
  await db.log.create({
    data: { userId: user.id, action: "DELETE", entity: "Ad", entityId: adId },
  });

  revalidatePath("/ads");
  revalidatePath("/dashboard");

  return { success: true };
}
