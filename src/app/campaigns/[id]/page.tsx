import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getCampaignById } from "@/services/campaigns.service";
import { CampaignDetailClient } from "./_client";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const campaign = await getCampaignById(id);

  if (!campaign) notFound();

  return <CampaignDetailClient campaign={campaign} />;
}
