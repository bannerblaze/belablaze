import { Suspense } from "react";
import { connection } from "next/server";
import { ApprovalsClient } from "./_client";
import { mockAds, mockCampaigns } from "@/lib/mock-data";

function ApprovalsSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-[900px]">
      <div className="h-10 w-64 rounded-lg bg-white/[0.05] animate-pulse" />
      <div className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
      <div className="h-12 w-72 rounded-xl bg-white/[0.04] animate-pulse" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

async function ApprovalsData() {
  await connection();
  const hasDb = !!process.env.DATABASE_URL;

  if (!hasDb) {
    const pending = mockAds.filter((a) => a.status === "PENDING_REVIEW").map((a) => ({
      ...a,
      campaign: mockCampaigns.find((c) => c.id === a.campaignId),
    }));
    const approved = mockAds.filter((a) => a.status === "APPROVED" || a.status === "ACTIVE").map((a) => ({
      ...a,
      campaign: mockCampaigns.find((c) => c.id === a.campaignId),
    }));
    const rejected = mockAds.filter((a) => a.status === "REJECTED").map((a) => ({
      ...a,
      campaign: mockCampaigns.find((c) => c.id === a.campaignId),
    }));

    return (
      <ApprovalsClient
        initialPending={pending as Parameters<typeof ApprovalsClient>[0]["initialPending"]}
        initialApproved={approved as Parameters<typeof ApprovalsClient>[0]["initialApproved"]}
        initialRejected={rejected as Parameters<typeof ApprovalsClient>[0]["initialRejected"]}
      />
    );
  }

  const { getAdsForApprovals } = await import("@/services/ads.service");
  const { pending, approved, rejected } = await getAdsForApprovals();

  return (
    <ApprovalsClient
      initialPending={pending as Parameters<typeof ApprovalsClient>[0]["initialPending"]}
      initialApproved={approved as Parameters<typeof ApprovalsClient>[0]["initialApproved"]}
      initialRejected={rejected as Parameters<typeof ApprovalsClient>[0]["initialRejected"]}
    />
  );
}

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<ApprovalsSkeleton />}>
      <ApprovalsData />
    </Suspense>
  );
}
