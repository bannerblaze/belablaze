import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OnboardingGate } from "@/components/auth/onboarding-gate";
import { checkAccountTypeAccess } from "@/lib/access";

/* ──────────────────────────────────────────────────────────────────────
 * /screens — DOOH fleet management.
 *
 * Access: ORGANIZATION accounts (org owners managing their own screen
 * network) + INTERNAL accounts (BannerBlaze staff with cross-org ops).
 * PERSON (creator) accounts are redirected to /dashboard.
 *
 * This gate runs at layout level so every future /screens/* route
 * inherits it automatically.
 * ────────────────────────────────────────────────────────────────────── */

export default async function Layout({ children }: { children: React.ReactNode }) {
  const blocked = await checkAccountTypeAccess(["ORGANIZATION", "INTERNAL"], "/dashboard");
  if (blocked) redirect(blocked);

  return (
    <OnboardingGate>
      <DashboardShell>{children}</DashboardShell>
    </OnboardingGate>
  );
}
