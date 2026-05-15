import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OnboardingGate } from "@/components/auth/onboarding-gate";
import { checkPlatformStaffAccess } from "@/lib/access";

/* ──────────────────────────────────────────────────────────────────────
 * /screens is a BannerBlaze-internal operations module.
 *
 * Access is restricted to platform staff:
 *   • SUPER_ADMIN — admin@bannerblaze.com, ceo@bannerblaze.com, or any
 *     email in ADMIN_WHITELIST_EMAILS
 *   • SUPPORT    — accountType = INTERNAL
 *
 * ORGANIZATION accounts (business customers) and PERSON accounts
 * (creators) MUST NOT reach this surface — not via sidebar, not via
 * direct URL, not via API. The gate runs at the layout level so EVERY
 * route under /screens/* (current + future) inherits it without having
 * to remember the check on each page.
 *
 * Defense-in-depth: this is the first of five layers (layout → page →
 * actions → service → API).
 * ────────────────────────────────────────────────────────────────────── */

export default async function Layout({ children }: { children: React.ReactNode }) {
  const blocked = await checkPlatformStaffAccess("/dashboard");
  if (blocked) redirect(blocked);

  return (
    <OnboardingGate>
      <DashboardShell>{children}</DashboardShell>
    </OnboardingGate>
  );
}
