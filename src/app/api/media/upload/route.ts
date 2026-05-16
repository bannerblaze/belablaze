import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { uploadFile, validateMime, inferMediaType, MAX_UPLOAD_BYTES, ACCEPTED_MIME } from "@/lib/storage";
import { logAudit } from "@/actions/audit";

/* Streaming multipart upload — used by the client UploadDropzone.
 * Returns 413 for oversize and 415 for unsupported mime. */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireOrgContext();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Archivo requerido" }, { status: 400 });
    }

    if (!validateMime(file.type)) {
      return NextResponse.json(
        { ok: false, error: `Tipo no permitido. Aceptados: ${ACCEPTED_MIME.join(", ")}` },
        { status: 415 },
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { ok: false, error: `Archivo demasiado grande (${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} MB máximo por archivo).` },
        { status: 413 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadFile({
      organizationId: ctx.organizationId,
      fileName: file.name,
      contentType: file.type,
      buffer,
    });

    const asset = await db.mediaAsset.create({
      data: {
        organizationId: ctx.organizationId,
        uploadedById: ctx.userId,
        type: inferMediaType(file.type),
        name: file.name,
        mimeType: file.type,
        size: buffer.byteLength,
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

    return NextResponse.json({ ok: true, asset });
  } catch (err) {
    console.error("[media/upload] error:", err);
    return NextResponse.json({ ok: false, error: "Error subiendo el archivo" }, { status: 500 });
  }
}
