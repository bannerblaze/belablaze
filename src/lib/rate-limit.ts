import { db } from "@/lib/db";

/**
 * DB-backed rate limiting for admin onboarding attempts.
 *
 * Counts ADMIN_CODE_FAILED events for `email` in a sliding 15-minute window.
 * Uses the SecurityLog @@index([email, success, createdAt]) for O(log n) lookup.
 *
 * For higher-volume routes we'd move this to a dedicated RateLimitAttempt table
 * with TTL pruning — fine for FASE 5 admin-onboarding volume.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export type RateLimitStatus = {
  blocked: boolean;
  attempts: number;
  remaining: number;
  /** When the oldest counted attempt ages out (window expiry). */
  resetAt: Date;
};

/** Returns the current rate-limit status for the given email's admin-code attempts. */
export async function checkAdminRateLimit(email: string): Promise<RateLimitStatus> {
  const normalized = email.trim().toLowerCase();
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const recent = await db.securityLog.findMany({
    where: {
      email: normalized,
      event: "ADMIN_CODE_FAILED",
      success: false,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const attempts = recent.length;
  const remaining = Math.max(0, MAX_ATTEMPTS - attempts);
  // Reset is when the oldest counted attempt falls out of the window.
  const oldest = recent[0]?.createdAt ?? new Date();
  const resetAt = new Date(oldest.getTime() + WINDOW_MS);

  return {
    blocked: attempts >= MAX_ATTEMPTS,
    attempts,
    remaining,
    resetAt,
  };
}

export const ADMIN_RATE_LIMIT = {
  WINDOW_MS,
  MAX_ATTEMPTS,
} as const;
