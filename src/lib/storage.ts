import "server-only";
import { randomBytes } from "crypto";
import { ACCEPTED_MIME, MAX_UPLOAD_BYTES } from "./storage-constants";
export { ACCEPTED_MIME, MAX_UPLOAD_BYTES };

/* ──────────────────────────────────────────────────────────────────────
 * Storage abstraction layer — server-only.
 *
 * The current implementation is a `local` driver that writes to
 * `public/uploads/{org}/...` so dev works out of the box. The driver
 * surface (upload, delete, signedUrl) is shaped so that swapping to
 * Vercel Blob, AWS S3 or Cloudflare R2 is a one-file change.
 *
 * Env-controlled selection:
 *   STORAGE_DRIVER = "local" | "vercel_blob" | "s3" | "r2"
 *
 * Client components must import from `storage-constants.ts` instead —
 * pulling `fs/promises` into the browser bundle would explode the build.
 * ────────────────────────────────────────────────────────────────────── */

export type StorageDriver = "local" | "vercel_blob" | "s3" | "r2";

export interface UploadInput {
  organizationId: string;
  fileName: string;
  contentType: string;
  buffer: Buffer | Uint8Array;
}

export interface UploadResult {
  storageKey: string;
  url: string;
  driver: StorageDriver;
  size: number;
}

const DRIVER: StorageDriver = (process.env.STORAGE_DRIVER as StorageDriver) || "local";

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function buildKey(organizationId: string, fileName: string): string {
  const rand = randomBytes(6).toString("hex");
  const safe = safeFileName(fileName);
  return `${organizationId}/${rand}-${safe}`;
}

/* ─── Local driver (filesystem) ─────────────────────────────────────── */

async function uploadLocal(input: UploadInput): Promise<UploadResult> {
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");
  const key = buildKey(input.organizationId, input.fileName);
  const dir = path.join(process.cwd(), "public", "uploads", input.organizationId);
  await mkdir(dir, { recursive: true });
  const file = path.join(process.cwd(), "public", "uploads", key);
  await writeFile(file, input.buffer);
  const buffer = input.buffer instanceof Buffer ? input.buffer : Buffer.from(input.buffer);
  return {
    storageKey: key,
    url: `/uploads/${key}`,
    driver: "local",
    size: buffer.byteLength,
  };
}

async function deleteLocal(storageKey: string): Promise<void> {
  try {
    const { unlink } = await import("fs/promises");
    const path = await import("path");
    await unlink(path.join(process.cwd(), "public", "uploads", storageKey));
  } catch {
    // Already deleted or never existed — non-fatal.
  }
}

/* ─── Vercel Blob driver (lazy) ─────────────────────────────────────── */

async function uploadVercelBlob(input: UploadInput): Promise<UploadResult> {
  // @ts-expect-error — optional dependency, resolved at runtime when configured.
  const mod = await import(/* webpackIgnore: true */ "@vercel/blob").catch(() => null);
  if (!mod) throw new Error("Vercel Blob driver selected but `@vercel/blob` is not installed");
  const key = buildKey(input.organizationId, input.fileName);
  const blob = await mod.put(key, input.buffer, {
    access: "public",
    contentType: input.contentType,
  });
  const buffer = input.buffer instanceof Buffer ? input.buffer : Buffer.from(input.buffer);
  return {
    storageKey: key,
    url: blob.url,
    driver: "vercel_blob",
    size: buffer.byteLength,
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
  console.log("[storage] driver=r2 uploadR2 called", {
    organizationId: input.organizationId,
    fileName:       input.fileName,
    contentType:    input.contentType,
    sizeBytes:      input.buffer.byteLength,
    STORAGE_DRIVER: process.env.STORAGE_DRIVER,
    R2_ENDPOINT:    process.env.R2_ENDPOINT ?? "(not set)",
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ?? "(not set)",
    R2_PUBLIC_URL:  process.env.R2_PUBLIC_URL ?? "(not set)",
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID
      ? process.env.R2_ACCESS_KEY_ID.slice(0, 8) + "…"
      : "(not set)",
  });

  const { uploadToR2 } = await import("./r2");
  const key = buildKey(input.organizationId, input.fileName);
  const buf = input.buffer instanceof Buffer ? input.buffer : Buffer.from(input.buffer);

  console.log("[storage] r2 storageKey:", key);

  try {
    const url = await uploadToR2(key, buf, input.contentType);
    console.log("[storage] r2 upload succeeded →", url);
    return { storageKey: key, url, driver: "r2", size: buf.byteLength };
  } catch (err) {
    console.error("[storage] r2 upload failed — re-throwing");
    throw err;
  }
}

async function deleteR2(storageKey: string): Promise<void> {
  console.log("[storage] driver=r2 deleteR2 called", { storageKey });
  const { deleteFromR2 } = await import("./r2");
  await deleteFromR2(storageKey);
}

/* ─── AWS S3 driver stub (add @aws-sdk/client-s3 + credentials when needed) */

async function uploadS3(): Promise<UploadResult> {
  throw new Error("S3 driver not yet configured — use STORAGE_DRIVER=r2 for Cloudflare R2.");
}
async function deleteS3(): Promise<void> {
  throw new Error("S3 driver not yet configured.");
}

/* ─── Public API ────────────────────────────────────────────────────── */

export async function uploadFile(input: UploadInput): Promise<UploadResult> {
  switch (DRIVER) {
    case "vercel_blob": return uploadVercelBlob(input);
    case "r2":          return uploadR2(input);
    case "s3":          return uploadS3();
    case "local":
    default:            return uploadLocal(input);
  }
}

export async function deleteFile(storageKey: string): Promise<void> {
  switch (DRIVER) {
    case "vercel_blob": return deleteVercelBlob(storageKey);
    case "r2":          return deleteR2(storageKey);
    case "s3":          return deleteS3();
    case "local":
    default:            return deleteLocal(storageKey);
  }
}

export function currentDriver(): StorageDriver {
  return DRIVER;
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
