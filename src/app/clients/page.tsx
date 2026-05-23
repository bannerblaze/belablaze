import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { listClients } from "@/actions/clients";
import { ClientsClient } from "./_client";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  noStore();
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const clients = await listClients();

  return (
    <ClientsClient
      clients={clients.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
