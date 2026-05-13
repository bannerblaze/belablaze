/**
 * Admin email whitelist — first line of defense for the /onboarding/admin flow.
 *
 * Sources (merged, lowercased, deduped):
 *   1. Static defaults below
 *   2. Comma-separated `ADMIN_WHITELIST_EMAILS` environment variable
 *
 * An email that isn't in this list cannot proceed past the admin onboarding
 * gate, regardless of access code. All denied attempts are persisted to
 * SecurityLog and surfaced via sendAdminAlert().
 */

const STATIC_WHITELIST: readonly string[] = [
  "admin@bannerblaze.com",
  "ceo@bannerblaze.com",
];

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

function loadWhitelist(): Set<string> {
  const envList = process.env.ADMIN_WHITELIST_EMAILS
    ?.split(",")
    .map(normalize)
    .filter(Boolean) ?? [];
  return new Set([...STATIC_WHITELIST.map(normalize), ...envList]);
}

export const ADMIN_WHITELIST: ReadonlySet<string> = loadWhitelist();

export function isAdminWhitelisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_WHITELIST.has(normalize(email));
}
