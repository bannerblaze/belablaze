/* Client-safe storage constants. Kept in a separate file so client
 * components can import the allowlist + size limits without pulling
 * in Node-only modules (fs/promises, path) used by the server driver. */

export const ACCEPTED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
];

/** Per-file upload size cap per plan tier (bytes). Aggregate storage
 *  limits live in src/lib/plans.ts → PlanLimits.storageMB. */
export const SIZE_LIMITS: Record<"FREE" | "STARTER" | "GROWTH" | "ENTERPRISE", number> = {
  FREE: 10 * 1024 * 1024,
  STARTER: 25 * 1024 * 1024,
  GROWTH: 100 * 1024 * 1024,
  ENTERPRISE: 500 * 1024 * 1024,
};
