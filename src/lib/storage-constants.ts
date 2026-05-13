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

export const SIZE_LIMITS: Record<"STARTER" | "GROWTH" | "ENTERPRISE", number> = {
  STARTER: 25 * 1024 * 1024,
  GROWTH: 100 * 1024 * 1024,
  ENTERPRISE: 500 * 1024 * 1024,
};
