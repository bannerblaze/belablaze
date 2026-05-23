import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getClients } from "@/services/clients.service";
import { NewCampaignClient } from "./_client";

export default async function NewCampaignPage() {
  await connection();

  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN" || user?.role === "EXECUTIVE";

  const clients = await getClients({ limit: 100 });
  const autoClientId = !isAdmin ? (clients[0]?.id ?? "") : undefined;

  return (
    <NewCampaignClient
      clients={isAdmin ? clients.map((c) => ({ id: c.id, name: c.name, industry: c.industry })) : []}
      isAdmin={isAdmin ?? false}
      autoClientId={autoClientId}
    />
  );
}
