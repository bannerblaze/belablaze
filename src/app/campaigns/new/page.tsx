import { connection } from "next/server";
import { getClients } from "@/services/clients.service";
import { NewCampaignClient } from "./_client";

export default async function NewCampaignPage() {
  await connection();
  const clients = await getClients({ limit: 100 });

  return <NewCampaignClient clients={clients} />;
}
