import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AdsClient } from "./_client";
import { mockAds, mockCampaigns } from "@/lib/mock-data";
import { requireOrgContext } from "@/lib/org-context";
import { can } from "@/lib/rbac";

function AdsSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-[1600px]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-14 border-b border-white/[0.06] animate-pulse" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 border-b border-white/[0.04] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

const mockCampaignRefs = mockCampaigns.map((c) => ({
  id: c.id,
  name: c.name,
  client: c.client ? { name: c.client.name } : null,
}));

async function AdsData() {
  await connection();
  const hasDb = !!process.env.DATABASE_URL;

  if (!hasDb) {
    return (
      <AdsClient
        initialAds={mockAds as Parameters<typeof AdsClient>[0]["initialAds"]}
        campaigns={mockCampaignRefs}
      />
    );
  }

  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");
  if (!can(ctx.role, "ads:view")) redirect("/dashboard");

  const { getAds } = await import("@/services/ads.service");
  const ads = await getAds({ limit: 100 });

  const campaignRefs = Array.from(
    new Map(
      ads
        .filter((a) => a.campaign)
        .map((a) => [a.campaign!.id, { id: a.campaign!.id, name: a.campaign!.name, client: a.campaign!.client }])
    ).values()
  );

  return (
    <AdsClient
      initialAds={ads as unknown as Parameters<typeof AdsClient>[0]["initialAds"]}
      campaigns={campaignRefs}
    />
  );
}

export default function AdsPage() {
  return (
    <Suspense fallback={<AdsSkeleton />}>
      <AdsData />
    </Suspense>
  );
}
