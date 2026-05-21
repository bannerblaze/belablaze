import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { uploadFile, validateMime, inferMediaType, MAX_UPLOAD_BYTES, ACCEPTED_MIME } from "@/lib/storage";
import { logAudit } from "@/actions/audit";

/* Streaming multipart upload — used by the client UploadDropzone.
 * Returns 413 for oversize and 415 for unsupported mime. */

export const runtime = "nodejs";

const IS_DEV = process.env.NODE_ENV !== "production";

export async function POST(req: NextRequest) {
  console.log("[upload] ─── POST /api/media/upload ───────────────────");
  console.log("[upload] STORAGE_DRIVER :", process.env.STORAGE_DRIVER ?? "(not set → local)");
  console.log("[upload] R2_ENDPOINT    :", process.env.R2_ENDPOINT    ?? "(not set)");
  console.log("[upload] R2_BUCKET_NAME :", process.env.R2_BUCKET_NAME ?? "(not set)");
  console.log("[upload] R2_PUBLIC_URL  :", process.env.R2_PUBLIC_URL  ?? "(not set)");
  console.log("[upload] R2_ACCESS_KEY_ID:",
    process.env.R2_ACCESS_KEY_ID
      ? process.env.R2_ACCESS_KEY_ID.slice(0, 8) + "…"
      : "(not set)");

  try {
    const ctx = await requireOrgContext();
    console.log("[upload] orgId:", ctx.organizationId, "userId:", ctx.userId);

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      console.warn("[upload] no file in form data");
      return NextResponse.json({ ok: false, error: "Archivo requerido" }, { status: 400 });
    }

    console.log("[upload] file received:", {
      name:     file.name,
      type:     file.type,
      size:     file.size,
      sizeMB:   (file.size / 1024 / 1024).toFixed(2) + " MB",
    });

    if (!validateMime(file.type)) {
      console.warn("[upload] MIME rejected:", file.type, "accepted:", ACCEPTED_MIME);
      return NextResponse.json(
        { ok: false, error: `Tipo no permitido. Aceptados: ${ACCEPTED_MIME.join(", ")}` },
        { status: 415 },
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      console.warn("[upload] file too large:", file.size, "max:", MAX_UPLOAD_BYTES);
      return NextResponse.json(
        { ok: false, error: `Archivo demasiado grande (${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} MB máximo por archivo).` },
        { status: 413 },
      );
    }

    console.log("[upload] reading arrayBuffer…");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("[upload] buffer ready, byteLength:", buffer.byteLength);

    console.log("[upload] calling uploadFile()…");
    let uploaded;
    try {
      uploaded = await uploadFile({
        organizationId: ctx.organizationId,
        fileName:       file.name,
        contentType:    file.type,
        buffer,
      });
    } catch (storageErr) {
      const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
      console.error("[upload] uploadFile() threw:", msg);
      if (storageErr instanceof Error) {
        console.error("[upload] stack:", storageErr.stack);
      }
      const responseMsg = IS_DEV ? msg : "Error subiendo el archivo";
      return NextResponse.json({ ok: false, error: responseMsg }, { status: 500 });
    }

    console.log("[upload] uploadFile() result:", {
      storageKey: uploaded.storageKey,
      url:        uploaded.url,
      driver:     uploaded.driver,
      size:       uploaded.size,
    });

    console.log("[upload] creating MediaAsset in DB…");
    const asset = await db.mediaAsset.create({
      data: {
        organizationId: ctx.organizationId,
        uploadedById:   ctx.userId,
        type:           inferMediaType(file.type),
        name:           file.name,
        mimeType:       file.type,
        size:           buffer.byteLength,
        storageKey:     uploaded.storageKey,
        url:            uploaded.url,
      },
    });
    console.log("[upload] MediaAsset created:", asset.id);

    await logAudit({
      action:     "media.upload",
      entityType: "MediaAsset",
      entityId:   asset.id,
      metadata:   { name: asset.name, size: asset.size, type: asset.type, driver: uploaded.driver },
    });

    console.log("[upload] ✓ success, returning asset");
    return NextResponse.json({ ok: true, asset });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload] unhandled error:", msg);
    if (err instanceof Error) console.error("[upload] stack:", err.stack);
    const responseMsg = IS_DEV ? msg : "Error subiendo el archivo";
    return NextResponse.json({ ok: false, error: responseMsg }, { status: 500 });
  }
}
