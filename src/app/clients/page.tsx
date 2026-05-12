import { Suspense } from "react";
import { connection } from "next/server";
import { ClientsClient } from "./_client";
import { mockClients, mockCampaigns } from "@/lib/mock-data";

function ClientsSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-64 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

async function ClientsData() {
  await connection();
  const hasDb = !!process.env.DATABASE_URL;

  if (!hasDb) {
    return (
      <ClientsClient
        clients={mockClients as Parameters<typeof ClientsClient>[0]["clients"]}
        totalCampaigns={mockCampaigns.length}
      />
    );
  }

  const [{ getClients }, { getCampaignMetrics }] = await Promise.all([
    import("@/services/clients.service"),
    import("@/services/campaigns.service"),
  ]);

  const [clients, metrics] = await Promise.all([
    getClients(),
    getCampaignMetrics(),
  ]);

  return (
    <ClientsClient
      clients={clients as Parameters<typeof ClientsClient>[0]["clients"]}
      totalCampaigns={metrics.total}
    />
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<ClientsSkeleton />}>
      <ClientsData />
    </Suspense>
  );
}
