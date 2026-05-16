"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { isPlatformStaffSession } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/actions/audit";

/* Platform-staff-only ad moderation mutations.
 *
 * All actions verify isPlatformStaffSession() — no org-scope restriction,
 * since moderators review ads across all organizations. */

async function requireStaff() {
  const ok = await isPlatformStaffSession();
  if (!ok) throw new Error("Acceso restringido al personal de BannerBlaze");
}

function revalidateApprovals() {
  revalidatePath("/approvals");
  revalidatePath("/ads");
  revalidatePath("/dashboard");
}

export async function approveAd(adId: string) {
  await requireStaff();

  const [ad, reviewer] = await Promise.all([
    db.ad.findUnique({
      where: { id: adId },
      select: { id: true, status: true, title: true },
    }),
    getCurrentUser(),
  ]);

  if (!ad) throw new Error("Anuncio no encontrado");
  if (ad.status !== "PENDING_REVIEW") throw new Error("El anuncio no está en revisión");
  if (!reviewer) throw new Error("No autenticado");

  await db.$transaction([
    db.ad.update({
      where: { id: adId },
      data: {
        status: "APPROVED",
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
      },
    }),
    db.adApproval.create({ data: { adId, userId: reviewer.id, approved: true } }),
  ]);

  await logAudit({
    action: "ad.approve",
    entityType: "Ad",
    entityId: adId,
    metadata: { title: ad.title, from: ad.status },
  });

  revalidateApprovals();
  return { success: true };
}

export async function rejectAd(adId: string, note: string) {
  await requireStaff();

  const trimmed = note.trim();
  if (!trimmed) throw new Error("El motivo de rechazo es obligatorio");

  const [ad, reviewer] = await Promise.all([
    db.ad.findUnique({
      where: { id: adId },
      select: { id: true, status: true, title: true },
    }),
    getCurrentUser(),
  ]);

  if (!ad) throw new Error("Anuncio no encontrado");
  if (ad.status !== "PENDING_REVIEW") throw new Error("El anuncio no está en revisión");
  if (!reviewer) throw new Error("No autenticado");

  await db.$transaction([
    db.ad.update({
      where: { id: adId },
      data: {
        status: "REJECTED",
        rejectionNote: trimmed,
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
      },
    }),
    db.adApproval.create({ data: { adId, userId: reviewer.id, approved: false, note: trimmed } }),
  ]);

  await logAudit({
    action: "ad.reject",
    entityType: "Ad",
    entityId: adId,
    metadata: { title: ad.title, from: ad.status, note: trimmed },
  });

  revalidateApprovals();
  return { success: true };
}

export async function publishAd(adId: string) {
  await requireStaff();

  const [ad, reviewer] = await Promise.all([
    db.ad.findUnique({
      where: { id: adId },
      select: { id: true, status: true, title: true },
    }),
    getCurrentUser(),
  ]);

  if (!ad) throw new Error("Anuncio no encontrado");
  if (ad.status !== "APPROVED") throw new Error("Solo se pueden publicar anuncios aprobados");
  if (!reviewer) throw new Error("No autenticado");

  await db.ad.update({
    where: { id: adId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      reviewedBy: reviewer.id,
    },
  });

  await logAudit({
    action: "ad.publish",
    entityType: "Ad",
    entityId: adId,
    metadata: { title: ad.title },
  });

  revalidateApprovals();
  return { success: true };
}
