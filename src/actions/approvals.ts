"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminOrExecutive } from "@/lib/auth";

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
