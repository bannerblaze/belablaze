import "server-only";
import { randomBytes } from "crypto";
import { ACCEPTED_MIME, MAX_UPLOAD_BYTES } from "./storage-constants";
export { ACCEPTED_MIME, MAX_UPLOAD_BYTES };

/* ──────────────────────────────────────────────────────────────────────
 * Storage abstraction layer — server-only.
 *
 * Driver resolution order (first match wins):
 *   1. STORAGE_DRIVER env var (explicit override)
 *   2. R2_ENDPOINT present   → "r2"
 *   3. BLOB_READ_WRITE_TOKEN present → "vercel_blob"
 *   4. otherwise             → THROWS (no local filesystem fallback)
 * ────────────────────────────────────────────────────────────────────── */

export type StorageDriver = "vercel_blob" | "s3" | "r2";

export interface UploadInput {
  organizationId: string;
  fileName:       string;
  contentType:    string;
  buffer:         Buffer | Uint8Array;
}

export interface UploadResult {
  storageKey: string;
  url:        string;
  driver:     StorageDriver;
  size:       number;
}

/* ─── Driver resolution ────────────────────────────────────────────── */

function resolveDriver(): StorageDriver {
  const explicit = (process.env.STORAGE_DRIVER ?? "").trim() as StorageDriver;
  const hasR2    = !!process.env.R2_ENDPOINT;
  const hasBlob  = !!process.env.BLOB_READ_WRITE_TOKEN;

  let driver: StorageDriver;
  let reason: string;

  if (explicit && explicit !== ("local" as string)) {
    driver = explicit as StorageDriver;
    reason = `STORAGE_DRIVER=${explicit} (explicit)`;
  } else if (hasR2) {
    driver = "r2";
    reason = "R2_ENDPOINT present (auto-detected)";
  } else if (hasBlob) {
    driver = "vercel_blob";
    reason = "BLOB_READ_WRITE_TOKEN present (auto-detected)";
  } else {
    const msg =
      "[storage] FATAL: No storage driver configured.\n" +
      "  Set one of:\n" +
      "    R2_ENDPOINT + R2_BUCKET_NAME + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY + R2_PUBLIC_URL\n" +
      "    BLOB_READ_WRITE_TOKEN";
    console.error(msg);
    throw new Error(msg);
  }

  console.log("[storage] driver resolved:", driver, "—", reason);
  console.log("[storage] env snapshot:", {
    STORAGE_DRIVER:    process.env.STORAGE_DRIVER   ?? "(not set)",
    R2_ENDPOINT:       process.env.R2_ENDPOINT       ?? "(not set)",
    R2_BUCKET_NAME:    process.env.R2_BUCKET_NAME    ?? "(not set)",
    R2_PUBLIC_URL:     process.env.R2_PUBLIC_URL     ?? "(not set)",
    R2_ACCESS_KEY_ID:  process.env.R2_ACCESS_KEY_ID
      ? process.env.R2_ACCESS_KEY_ID.slice(0, 8) + "…"
      : "(not set)",
    BLOB_READ_WRITE_TOKEN: hasBlob ? "set" : "(not set)",
    NODE_ENV: process.env.NODE_ENV,
  });

  return driver;
}

/* ─── Key generation ────────────────────────────────────────────────── */

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function buildKey(organizationId: string, fileName: string): string {
  const rand = randomBytes(6).toString("hex");
  const safe = safeFileName(fileName);
  return `${organizationId}/${rand}-${safe}`;
}

/* ─── Vercel Blob driver (lazy) ─────────────────────────────────────── */

async function uploadVercelBlob(input: UploadInput): Promise<UploadResult> {
  // @ts-expect-error — optional dependency, resolved at runtime when configured.
  const mod = await import(/* webpackIgnore: true */ "@vercel/blob").catch(() => null);
  if (!mod) throw new Error("Vercel Blob driver selected but `@vercel/blob` is not installed");
  const key  = buildKey(input.organizationId, input.fileName);
  const blob = await mod.put(key, input.buffer, {
    access:      "public",
    contentType: input.contentType,
  });
  const buffer = input.buffer instanceof Buffer ? input.buffer : Buffer.from(input.buffer);
  return {
    storageKey: key,
    url:        blob.url,
    driver:     "vercel_blob",
    size:       buffer.byteLength,
  };
}

async function deleteVercelBlob(storageKey: string): Promise<void> {
  // @ts-expect-error — optional dependency.
  const mod = await import(/* webpackIgnore: true */ "@vercel/blob").catch(() => null);
  if (!mod) return;
  await mod.del(storageKey).catch(() => {});
}

/* ─── Cloudflare R2 driver (S3-compatible) ──────────────────────────── */

async function uploadR2(input: UploadInput): Promise<UploadResult> {
  console.log("[storage/r2] uploadR2 called", {
    organizationId: input.organizationId,
    fileName:       input.fileName,
    contentType:    input.contentType,
    sizeBytes:      input.buffer.byteLength,
    sizeMB:         (input.buffer.byteLength / 1024 / 1024).toFixed(2),
    R2_ENDPOINT:    process.env.R2_ENDPOINT    ?? "(not set)",
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ?? "(not set)",
    R2_PUBLIC_URL:  process.env.R2_PUBLIC_URL  ?? "(not set)",
  });

  const { uploadToR2 } = await import("./r2");
  const key = buildKey(input.organizationId, input.fileName);
  const buf = input.buffer instanceof Buffer ? input.buffer : Buffer.from(input.buffer);

  console.log("[storage/r2] storageKey:", key);

  try {
    const url = await uploadToR2(key, buf, input.contentType);
    console.log("[storage/r2] upload succeeded →", url);
    return { storageKey: key, url, driver: "r2", size: buf.byteLength };
  } catch (err) {
    console.error("[storage/r2] upload FAILED — re-throwing");
    throw err;
  }
}

async function deleteR2(storageKey: string): Promise<void> {
  console.log("[storage/r2] deleteR2:", storageKey);
  const { deleteFromR2 } = await import("./r2");
  await deleteFromR2(storageKey);
}

/* ─── AWS S3 driver stub ────────────────────────────────────────────── */

async function uploadS3(): Promise<UploadResult> {
  throw new Error(
    "[storage/s3] S3 driver not yet configured. Use STORAGE_DRIVER=r2 for Cloudflare R2.",
  );
}
async function deleteS3(): Promise<void> {
  throw new Error("[storage/s3] S3 driver not yet configured.");
}

/* ─── Public API ────────────────────────────────────────────────────── */

export async function uploadFile(input: UploadInput): Promise<UploadResult> {
  const driver = resolveDriver();
  console.log("[storage] uploadFile — driver:", driver);
  switch (driver) {
    case "vercel_blob": return uploadVercelBlob(input);
    case "r2":          return uploadR2(input);
    case "s3":          return uploadS3();
  }
}

export async function deleteFile(storageKey: string): Promise<void> {
  const driver = resolveDriver();
  console.log("[storage] deleteFile — driver:", driver, "key:", storageKey);
  switch (driver) {
    case "vercel_blob": return deleteVercelBlob(storageKey);
    case "r2":          return deleteR2(storageKey);
    case "s3":          return deleteS3();
  }
}

export function currentDriver(): StorageDriver {
  return resolveDriver();
}

export function validateMime(mime: string): boolean {
  return ACCEPTED_MIME.includes(mime.toLowerCase());
}

export function inferMediaType(mime: string): "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("audio/")) return "AUDIO";
  return "DOCUMENT";
}
