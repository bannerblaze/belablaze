import "server-only";

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

/* ──────────────────────────────────────────────────────────────────────
 * Cloudflare R2 storage client — server-only, verbose logging.
 * ────────────────────────────────────────────────────────────────────── */

const IS_DEV = process.env.NODE_ENV !== "production";

function r2log(msg: string, data?: unknown) {
  if (data !== undefined) {
    console.log(`[r2] ${msg}`, data);
  } else {
    console.log(`[r2] ${msg}`);
  }
}

function r2err(msg: string, err: unknown) {
  console.error(`[r2] ❌ ${msg}`);
  if (err instanceof Error) {
    console.error(`[r2]   message  : ${err.message}`);
    console.error(`[r2]   name     : ${err.name}`);
    // AWS SDK errors expose these
    const awsErr = err as Error & {
      Code?: string;
      $fault?: string;
      $metadata?: {
        httpStatusCode?: number;
        requestId?: string;
        cfId?: string;
        attempts?: number;
      };
    };
    if (awsErr.Code)          console.error(`[r2]   Code     : ${awsErr.Code}`);
    if (awsErr.$fault)        console.error(`[r2]   $fault   : ${awsErr.$fault}`);
    if (awsErr.$metadata) {
      console.error(`[r2]   status   : ${awsErr.$metadata.httpStatusCode}`);
      console.error(`[r2]   requestId: ${awsErr.$metadata.requestId}`);
      console.error(`[r2]   cfId     : ${awsErr.$metadata.cfId}`);
      console.error(`[r2]   attempts : ${awsErr.$metadata.attempts}`);
    }
    if (err.stack) console.error(`[r2]   stack:\n${err.stack}`);
  } else {
    console.error(`[r2]   raw:`, err);
  }
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) {
    const msg = `[r2] Missing environment variable: ${key}`;
    console.error(msg);
    throw new Error(msg);
  }
  return v;
}

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;

  const endpoint = requireEnv("R2_ENDPOINT");
  const keyId    = requireEnv("R2_ACCESS_KEY_ID");
  requireEnv("R2_SECRET_ACCESS_KEY"); // validates presence, value kept secret

  r2log("Creating S3Client", { endpoint, region: "auto", keyIdPrefix: keyId.slice(0, 8) + "…" });

  _client = new S3Client({
    region:   "auto",
    endpoint,
    credentials: {
      accessKeyId:     keyId,
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
  return _client;
}

function getBucket(): string {
  return requireEnv("R2_BUCKET_NAME");
}

function getPublicBase(): string {
  return requireEnv("R2_PUBLIC_URL").replace(/\/$/, "");
}

export function r2PublicUrl(key: string): string {
  return `${getPublicBase()}/${key}`;
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const bucket    = getBucket();
  const endpoint  = process.env.R2_ENDPOINT ?? "(not set)";
  const publicBase = getPublicBase();
  const sizeBytes = body.byteLength;

  r2log("uploadToR2 start", {
    key,
    bucket,
    endpoint,
    contentType,
    sizeBytes,
    sizeMB: (sizeBytes / 1024 / 1024).toFixed(2),
    publicUrl: `${publicBase}/${key}`,
  });

  const upload = new Upload({
    client:    getClient(),
    queueSize: 4,
    partSize:  5 * 1024 * 1024,
    params: {
      Bucket:      bucket,
      Key:         key,
      Body:        body,
      ContentType: contentType,
    },
  });

  upload.on("httpUploadProgress", (progress) => {
    r2log("upload progress", {
      loaded: progress.loaded,
      total:  progress.total,
      part:   progress.part,
      pct:    progress.total
        ? `${((progress.loaded ?? 0) / progress.total * 100).toFixed(1)}%`
        : "unknown",
    });
  });

  try {
    const result = await upload.done();
    r2log("uploadToR2 done ✓", {
      ETag:     result.ETag,
      Location: result.Location,
      Key:      result.Key,
      Bucket:   result.Bucket,
    });
  } catch (err) {
    r2err("uploadToR2 failed", err);
    throw err;
  }

  const publicUrl = r2PublicUrl(key);
  r2log("returning public URL", publicUrl);
  return publicUrl;
}

export async function deleteFromR2(key: string): Promise<void> {
  const bucket = getBucket();
  r2log("deleteFromR2", { key, bucket });

  try {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
    r2log("deleteFromR2 done ✓", { key });
  } catch (err) {
    const code = (err as { Code?: string; code?: string }).Code
      ?? (err as { code?: string }).code;
    if (code === "NoSuchKey") {
      r2log("deleteFromR2 — object not found (NoSuchKey), ignoring", { key });
      return;
    }
    r2err("deleteFromR2 failed", err);
    throw err;
  }
}
