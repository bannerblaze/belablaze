import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CampaignsClient } from "./_client";
import { CampaignCardSkeleton } from "@/components/ui/skeleton";
import { mockCampaigns } from "@/lib/mock-data";
import { requireOrgContext } from "@/lib/org-context";

function CampaignsSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => <CampaignCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

async function CampaignsData() {
  const hasDb = !!process.env.DATABASE_URL;

  if (!hasDb) {
    return <CampaignsClient campaigns={mockCampaigns as Parameters<typeof CampaignsClient>[0]["campaigns"]} />;
  }

  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const { getCampaigns } = await import("@/services/campaigns.service");
  const campaigns = await getCampaigns();

  return <CampaignsClient campaigns={campaigns as Parameters<typeof CampaignsClient>[0]["campaigns"]} />;
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<CampaignsSkeleton />}>
      <CampaignsData />
    </Suspense>
  );
}
