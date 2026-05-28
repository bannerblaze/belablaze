import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getClients, getOrCreateSelfClient } from "@/services/clients.service";
import { NewCampaignClient } from "./_client";

export default async function NewCampaignPage() {
  await connection();

  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN" || user?.role === "EXECUTIVE";

  if (isAdmin) {
    const clients = await getClients({ limit: 100 });
    return (
      <NewCampaignClient
        clients={clients.map((c) => ({ id: c.id, name: c.name, industry: c.industry }))}
        isAdmin={true}
        autoClientId={undefined}
      />
    );
  }

  // For COMPANY/CREATOR accounts: auto-provision the self-client so they
  // never see the "create a client first" gate.
  const selfClientId = await getOrCreateSelfClient();

  return (
    <NewCampaignClient
      clients={[]}
      isAdmin={false}
      autoClientId={selfClientId ?? undefined}
    />
  );
}
