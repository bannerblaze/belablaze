import { getCurrentUser } from "@/lib/auth";
import { listUserOrganizations } from "@/lib/org-context";
import { DashboardLayout } from "./dashboard-layout";
import type { OrgListItem } from "./org-switcher";

/* Server component that precomputes the org list for the active user
 * and hands it to the (client) DashboardLayout. Pages mount this shell
 * via their route layout so each navigation gets fresh data without
 * forcing the client to re-fetch on hydration. */

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  let organizations: OrgListItem[] = [];

  if (user) {
    const memberships = await listUserOrganizations(user.id);
    organizations = memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      logoUrl: m.organization.logoUrl,
      plan: m.organization.plan,
      role: m.role,
      isActive: m.organizationId === user.activeOrgId,
    }));
  }

  // Only ORGANIZATION-type accounts can spin up parallel organizations.
  // CREATOR (personal brand) and INTERNAL (BannerBlaze staff) keep their
  // single org and don't see the "Crear nueva organización" CTA.
  const canCreateOrg = user?.accountType === "ORGANIZATION";

  return (
    <DashboardLayout organizations={organizations} canCreateOrg={canCreateOrg}>
      {children}
    </DashboardLayout>
  );
}
