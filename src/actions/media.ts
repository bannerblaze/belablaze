"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { assertCan } from "@/lib/rbac";
import { uploadFile, deleteFile, validateMime, inferMediaType, SIZE_LIMITS, ACCEPTED_MIME } from "@/lib/storage";
import { assertWithinLimit, assertStorageHeadroom, PlanLimitError } from "@/lib/limits";
import { logAudit } from "@/actions/audit";

/* ──────────────────────────────────────────────────────────────────────
 * Media library server actions.
 *
 * Upload flow:
 *   client → POST /api/media/upload (FormData)
 *   route handler → calls uploadMedia() below (multipart parsing first)
 *
 * For server-action calls (small files / programmatic uploads) the
 * `uploadMediaFromBuffer()` variant takes a base64 string. The route
 * handler in src/app/api/media/upload/route.ts handles the streaming
 * multipart case for large files (videos).
 * ────────────────────────────────────────────────────────────────────── */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

export interface UploadInput {
  fileName: string;
  mimeType: string;
  base64: string;
  width?: number;
  height?: number;
  duration?: number;
}

export async function uploadMediaFromBuffer(input: UploadInput): Promise<Result<{ id: string; url: string }>> {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "media:upload");

  if (!validateMime(input.mimeType)) {
    return { ok: false, error: `Tipo no permitido. Aceptados: ${ACCEPTED_MIME.join(", ")}` };
  }

  const buffer = Buffer.from(input.base64, "base64");

  // Three independent checks: (1) mediaAssets count, (2) aggregate
  // storage headroom in MB, (3) per-file size cap. We catch
  // PlanLimitError so the client gets a structured "upgrade" message
  // instead of an unhandled 500.
  try {
    await assertWithinLimit(ctx.organizationId, "mediaAssets");
    const { plan } = await assertStorageHeadroom(ctx.organizationId, buffer.byteLength);
    const maxSize = SIZE_LIMITS[plan];
    if (buffer.byteLength > maxSize) {
      return { ok: false, error: `Archivo demasiado grande para tu plan ${plan} (${(maxSize / 1024 / 1024).toFixed(0)} MB máx por archivo).` };
    }
  } catch (err) {
    if (err instanceof PlanLimitError) return { ok: false, error: err.message };
    throw err;
  }

  const uploaded = await uploadFile({
    organizationId: ctx.organizationId,
    fileName: input.fileName,
    contentType: input.mimeType,
    buffer,
  });

  const asset = await db.mediaAsset.create({
    data: {
      organizationId: ctx.organizationId,
      uploadedById: ctx.userId,
      type: inferMediaType(input.mimeType),
      name: input.fileName,
      mimeType: input.mimeType,
      size: buffer.byteLength,
      width: input.width ?? null,
      height: input.height ?? null,
      duration: input.duration ?? null,
      storageKey: uploaded.storageKey,
      url: uploaded.url,
    },
  });

  await logAudit({
    action: "media.upload",
    entityType: "MediaAsset",
    entityId: asset.id,
    metadata: { name: asset.name, size: asset.size, type: asset.type },
  });

  revalidatePath("/media");
  return { ok: true, data: { id: asset.id, url: asset.url } };
}

export async function deleteMedia(assetId: string): Promise<Result> {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "media:delete");

  const asset = await db.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset || asset.organizationId !== ctx.organizationId) {
    return { ok: false, error: "Media no encontrada." };
  }

  await deleteFile(asset.storageKey).catch(() => {});
  await db.mediaAsset.delete({ where: { id: assetId } });
  await logAudit({ action: "media.delete", entityType: "MediaAsset", entityId: assetId, metadata: { name: asset.name } });
  revalidatePath("/media");
  return { ok: true };
}

export async function listMedia(input?: { type?: "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO"; search?: string }) {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "media:view");

  return db.mediaAsset.findMany({
    where: {
      organizationId: ctx.organizationId,
      isArchived: false,
      ...(input?.type ? { type: input.type } : {}),
      ...(input?.search ? { name: { contains: input.search, mode: "insensitive" as const } } : {}),
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getMediaStats() {
  const ctx = await requireOrgContext();
  const [count, sum] = await Promise.all([
    db.mediaAsset.count({ where: { organizationId: ctx.organizationId, isArchived: false } }),
    db.mediaAsset.aggregate({
      where: { organizationId: ctx.organizationId, isArchived: false },
      _sum: { size: true },
    }),
  ]);
  return { count, totalBytes: sum._sum.size ?? 0 };
}
