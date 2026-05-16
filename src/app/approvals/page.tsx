import { Suspense } from "react";
import { connection } from "next/server";
import { ApprovalsClient } from "./_client";
import {
  getModerationOverview,
  getPendingAds,
  getReviewedAds,
} from "@/services/admin/approvals.service";

function ApprovalsSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-6 max-w-[1200px]">
      <div className="h-10 w-72 rounded-xl bg-white/[0.05] animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
      <div className="h-10 w-96 rounded-xl bg-white/[0.04] animate-pulse" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

async function ApprovalsData() {
  await connection();

  const [overview, pending, approved, rejected, published] = await Promise.all([
    getModerationOverview(),
    getPendingAds(),
    getReviewedAds("APPROVED"),
    getReviewedAds("REJECTED"),
    getReviewedAds("PUBLISHED"),
  ]);

  return (
    <ApprovalsClient
      overview={overview}
      initialPending={pending}
      initialApproved={approved}
      initialRejected={rejected}
      initialPublished={published}
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
