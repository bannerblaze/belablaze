import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OnboardingGate } from "@/components/auth/onboarding-gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
      <DashboardShell>{children}</DashboardShell>
    </OnboardingGate>
  );
}
