import { getCurrentUser } from "@/lib/auth";
import { getPlatformRole } from "@/lib/platform";
import { DashboardLayout } from "./dashboard-layout";
import type { AccountType } from "@/types";
import type { PlatformRole } from "@/lib/platform";

/* Server component that precomputes the visibility signals
 * (accountType + platformRole) the sidebar needs. Pages mount this
 * shell via their route layout so each navigation gets fresh data
 * without forcing the client to re-fetch on hydration.
 *
 * Single-org-per-user model: no org list, no switcher, no create CTA. */

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const accountType: AccountType | null = user?.accountType ?? null;
  const platformRole: PlatformRole = getPlatformRole(user);

  return (
    <DashboardLayout accountType={accountType} platformRole={platformRole}>
      {children}
    </DashboardLayout>
  );
}
