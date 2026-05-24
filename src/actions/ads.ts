"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { logAudit } from "@/actions/audit";

/* Tenant-scoped ad mutations. Ads inherit org from their parent campaign,
 * so we always verify that the campaign belongs to the active org before
 * any write. */

async function loadOrgAd(orgId: string, adId: string) {
  return db.ad.findFirst({
    where: { id: adId, campaign: { organizationId: orgId } },
    select: { id: true, title: true, status: true, campaignId: true },
  });
}

export async function createAd(formData: FormData) {
  const ctx = await requireOrgContext();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const campaignId = formData.get("campaignId") as string;
  const format = formData.get("format") as string;
  const duration = parseInt(formData.get("duration") as string) || 15;
  const ctaText = formData.get("ctaText") as string;
  const ctaUrl = formData.get("ctaUrl") as string;
  const qrEnabled = formData.get("qrEnabled") === "true";

  // The campaign must belong to this org — prevents ad creation under a
  // foreign campaign via ID guessing.
  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!campaign) throw new Error("Campaña no encontrada en esta organización");

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

  await logAudit({ action: "ad.create", entityType: "Ad", entityId: ad.id, metadata: { title } });
  revalidatePath("/ads");
  return { success: true, id: ad.id };
}

export async function submitAdForReview(adId: string) {
  const ctx = await requireOrgContext();

  const ad = await loadOrgAd(ctx.organizationId, adId);
  if (!ad) throw new Error("Anuncio no encontrado");

  await db.ad.update({ where: { id: adId }, data: { status: "PENDING_REVIEW", submittedAt: new Date() } });
  await logAudit({
    action: "ad.update",
    entityType: "Ad",
    entityId: adId,
    metadata: { from: ad.status, to: "PENDING_REVIEW" },
  });

  revalidatePath("/ads");
  revalidatePath("/approvals");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function updateAdStatus(adId: string, status: "ACTIVE" | "PAUSED" | "DRAFT") {
  const ctx = await requireOrgContext();

  const ad = await loadOrgAd(ctx.organizationId, adId);
  if (!ad) throw new Error("Anuncio no encontrado");

  await db.ad.update({ where: { id: adId }, data: { status } });
  await logAudit({
    action: "ad.update",
    entityType: "Ad",
    entityId: adId,
    metadata: { from: ad.status, to: status },
  });

  revalidatePath("/ads");
  revalidatePath("/dashboard");

  return { success: true };
}

/** Links an uploaded MediaAsset to an ad — called right after file upload. */
export async function linkAdMedia(adId: string, mediaAssetId: string, fileUrl: string) {
  const ctx = await requireOrgContext();

  const ad = await loadOrgAd(ctx.organizationId, adId);
  if (!ad) throw new Error("Anuncio no encontrado");

  await db.ad.update({
    where: { id: adId },
    data: { mediaAssetId, fileUrl },
  });

  revalidatePath("/ads");
  return { success: true };
}

export async function deleteAd(adId: string) {
  const ctx = await requireOrgContext();

  const ad = await loadOrgAd(ctx.organizationId, adId);
  if (!ad) throw new Error("Anuncio no encontrado");

  if (ad.status === "ACTIVE") {
    throw new Error("No puedes eliminar un anuncio activo — pásalo a PAUSED primero.");
  }

  await db.ad.delete({ where: { id: adId } });
  await logAudit({ action: "ad.delete", entityType: "Ad", entityId: adId });

  revalidatePath("/ads");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function assignMediaToAd(adId: string, mediaAssetId: string) {
  const ctx = await requireOrgContext();

  const [ad, asset] = await Promise.all([
    loadOrgAd(ctx.organizationId, adId),
    db.mediaAsset.findFirst({
      where: { id: mediaAssetId, organizationId: ctx.organizationId },
      select: { id: true, url: true, type: true },
    }),
  ]);

  if (!ad) throw new Error("Anuncio no encontrado");
  if (!asset) throw new Error("Asset no encontrado");

  await db.ad.update({
    where: { id: adId },
    data: {
      mediaAssetId,
      fileUrl: asset.url,
      format: asset.type === "VIDEO" ? "VIDEO" : "IMAGE",
    },
  });

  await logAudit({ action: "ad.update", entityType: "Ad", entityId: adId, metadata: { mediaAssetId } });
  revalidatePath("/ads");
  return { success: true, fileUrl: asset.url, type: asset.type };
}

export async function getOrgMediaAssets() {
  const ctx = await requireOrgContext();
  const R2_BASE = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

  const assets = await db.mediaAsset.findMany({
    where: { organizationId: ctx.organizationId, isArchived: false },
    select: {
      id: true,
      name: true,
      type: true,
      mimeType: true,
      url: true,
      storageKey: true,
      size: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return assets.map((a) => {
    let resolvedUrl = a.url;
    if (!resolvedUrl?.startsWith("http") && a.storageKey && R2_BASE) {
      resolvedUrl = `${R2_BASE}/${a.storageKey}`;
    }
    return {
      ...a,
      url: resolvedUrl,
      createdAt: a.createdAt.toISOString(),
    };
  });
}
