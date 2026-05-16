import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OnboardingGate } from "@/components/auth/onboarding-gate";
import { checkPlatformStaffAccess } from "@/lib/access";

/* /clients is a BannerBlaze-internal admin panel for managing the
 * users registered on the platform (organizations + creators). Access
 * is restricted to platform staff at the layout level so every route
 * under /clients/* inherits the gate. */

export default async function Layout({ children }: { children: React.ReactNode }) {
  const blocked = await checkPlatformStaffAccess("/dashboard");
  if (blocked) redirect(blocked);

  return (
    <OnboardingGate>
      <DashboardShell>{children}</DashboardShell>
    </OnboardingGate>
  );
}
