import { getCurrentUser } from "@/lib/auth";
import { listUserOrganizations } from "@/lib/org-context";
import { getPlatformRole } from "@/lib/platform";
import { DashboardLayout } from "./dashboard-layout";
import type { OrgListItem } from "./org-switcher";
import type { AccountType } from "@/types";
import type { PlatformRole } from "@/lib/platform";

/* Server component that precomputes the org list and the visibility
 * signals (accountType + platformRole) the sidebar needs. Pages mount
 * this shell via their route layout so each navigation gets fresh data
 * without forcing the client to re-fetch on hydration. */

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  let organizations: OrgListItem[] = [];

  if (user) {
    const orgs = await listUserOrganizations(user.id);
    organizations = orgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      logoUrl: o.logoUrl,
      isActive: o.id === user.activeOrgId,
    }));
  }

  const accountType: AccountType | null = user?.accountType ?? null;
  const platformRole: PlatformRole = getPlatformRole(user);

  // Only ORGANIZATION accounts spin up parallel organizations. INTERNAL
  // BannerBlaze accounts also need this to manage demo tenants. PERSON
  // (creator) accounts keep their single org and don't see the CTA.
  const canCreateOrg = accountType === "ORGANIZATION" || accountType === "INTERNAL";

  return (
    <DashboardLayout
      organizations={organizations}
      canCreateOrg={canCreateOrg}
      accountType={accountType}
      platformRole={platformRole}
    >
      {children}
    </DashboardLayout>
  );
}
