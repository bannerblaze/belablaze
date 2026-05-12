"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function requireAdminOrExecutive() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "EXECUTIVE")) {
    throw new Error("Sin permisos para aprobar o rechazar anuncios");
  }

  return user;
}

export async function approveAd(adId: string) {
  const user = await requireAdminOrExecutive();

  await db.$transaction([
    db.ad.update({ where: { id: adId }, data: { status: "APPROVED" } }),
    db.adApproval.create({ data: { adId, userId: user.id, approved: true } }),
    db.log.create({
      data: {
        userId: user.id,
        action: "APPROVE",
        entity: "Ad",
        entityId: adId,
      },
    }),
  ]);

  revalidatePath("/approvals");
  revalidatePath("/ads");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function rejectAd(adId: string, note: string) {
  const user = await requireAdminOrExecutive();

  await db.$transaction([
    db.ad.update({ where: { id: adId }, data: { status: "REJECTED", rejectionNote: note } }),
    db.adApproval.create({ data: { adId, userId: user.id, approved: false, note } }),
    db.log.create({
      data: {
        userId: user.id,
        action: "REJECT",
        entity: "Ad",
        entityId: adId,
        newData: { note },
      },
    }),
  ]);

  revalidatePath("/approvals");
  revalidatePath("/ads");
  revalidatePath("/dashboard");

  return { success: true };
}
