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

/** Single global per-file upload size cap. The product no longer has
 *  per-tier upload limits — one number applies to every account. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB
