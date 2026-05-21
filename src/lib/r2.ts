import "server-only";

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

/* ──────────────────────────────────────────────────────────────────────
 * Cloudflare R2 storage client — server-only.
 *
 * R2 exposes an S3-compatible API. Configuration comes from env vars:
 *   R2_ENDPOINT        — https://<account_id>.r2.cloudflarestorage.com
 *   R2_BUCKET_NAME     — bucket name
 *   R2_ACCESS_KEY_ID   — R2 API token (Access Key ID)
 *   R2_SECRET_ACCESS_KEY — R2 API token (Secret)
 *   R2_PUBLIC_URL      — public base URL for generated asset URLs
 *                        e.g. https://cdn.bannerblaze.com  or
 *                             https://pub-<hash>.r2.dev
 *
 * The Upload helper from @aws-sdk/lib-storage automatically switches to
 * multipart uploads for files > 5 MB — no manual chunking required.
 *
 * Never import this file from client components (enforced by server-only).
 * ────────────────────────────────────────────────────────────────────── */

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`[r2] Missing environment variable: ${key}`);
  return v;
}

/** Lazy singleton — created once per process, never in the browser. */
let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: "auto",  // R2 uses "auto" region
    endpoint: requireEnv("R2_ENDPOINT"),
    credentials: {
      accessKeyId:     requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
  return _client;
}

function getBucket(): string {
  return requireEnv("R2_BUCKET_NAME");
}

/**
 * Returns the public base URL for the bucket, stripping any trailing slash.
 * Used to construct publicly-accessible media URLs for the DOOH player.
 */
function getPublicBase(): string {
  return requireEnv("R2_PUBLIC_URL").replace(/\/$/, "");
}

/** Builds the public CDN URL for a storage key. */
export function r2PublicUrl(key: string): string {
  return `${getPublicBase()}/${key}`;
}

/**
 * Uploads a file to R2 and returns its public URL.
 *
 * Uses @aws-sdk/lib-storage's Upload, which transparently falls back to
 * multipart upload for large files. The 100 MB limit is enforced at the
 * API route level before this function is called.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const upload = new Upload({
    client:  getClient(),
    queueSize: 4,           // parallel part uploads
    partSize: 5 * 1024 * 1024, // 5 MB per part (R2 minimum)
    params: {
      Bucket:      getBucket(),
      Key:         key,
      Body:        body,
      ContentType: contentType,
    },
  });

  await upload.done();
  return r2PublicUrl(key);
}

/**
 * Deletes a file from R2 by its storage key.
 * Swallows errors when the object no longer exists (idempotent).
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
    );
  } catch (err) {
    // NoSuchKey is not an error — the file may have already been removed.
    const code = (err as { Code?: string; code?: string }).Code
      ?? (err as { code?: string }).code;
    if (code !== "NoSuchKey") throw err;
  }
}
