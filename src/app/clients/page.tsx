import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { getCurrentUser } from "@/lib/auth";
import { isPlatformStaff } from "@/lib/platform";
import { listClients } from "@/actions/clients";
import { getOrganizationUsers, getCreatorUsers } from "@/services/admin/users.service";
import { ClientsClient } from "./_client";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  noStore();
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const user = await getCurrentUser();
  const isStaff = isPlatformStaff(user);

  const [clients, platformOrgs, platformCreators] = await Promise.all([
    listClients(),
    isStaff ? getOrganizationUsers() : Promise.resolve([]),
    isStaff ? getCreatorUsers() : Promise.resolve([]),
  ]);

  return (
    <ClientsClient
      clients={clients.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      }))}
      platformOrgs={isStaff ? platformOrgs : null}
      platformCreators={isStaff ? platformCreators : null}
    />
  );
}
