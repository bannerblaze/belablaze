import { Suspense } from "react";
import { connection } from "next/server";
import { ApprovalsClient } from "./_client";
import { CampaignApprovalsClient, type PendingCampaign } from "./_campaign-approvals";
import {
  getModerationOverview,
  getPendingAds,
  getReviewedAds,
} from "@/services/admin/approvals.service";
import { getCurrentUser } from "@/lib/auth";
import { isPlatformStaff } from "@/lib/platform";
import { db } from "@/lib/db";

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

async function fetchPendingCampaigns(): Promise<PendingCampaign[]> {
  const rows = await db.campaign.findMany({
    where: { status: "PENDING_APPROVAL" },
    select: {
      id: true,
      name: true,
      description: true,
      budget: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      client: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    budget: r.budget,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    client: r.client ? { name: r.client.name } : null,
    creator: r.user ? { name: r.user.name, email: r.user.email } : null,
  }));
}

async function ApprovalsData() {
  await connection();

  const user = await getCurrentUser();
  const isStaff = isPlatformStaff(user);
  const isOrgAdmin = user?.role === "ADMIN" || user?.role === "EXECUTIVE";

  const [overview, pending, approved, rejected, published, pendingCampaigns] =
    await Promise.all([
      isStaff ? getModerationOverview() : Promise.resolve(null),
      isStaff ? getPendingAds() : Promise.resolve([]),
      isStaff ? getReviewedAds("APPROVED") : Promise.resolve([]),
      isStaff ? getReviewedAds("REJECTED") : Promise.resolve([]),
      isStaff ? getReviewedAds("PUBLISHED") : Promise.resolve([]),
      isOrgAdmin ? fetchPendingCampaigns() : Promise.resolve([]),
    ]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 space-y-10 max-w-[1200px]">
      {isOrgAdmin && (
        <CampaignApprovalsClient initialCampaigns={pendingCampaigns} />
      )}
      {isStaff && (
        <ApprovalsClient
          overview={overview}
          initialPending={pending}
          initialApproved={approved}
          initialRejected={rejected}
          initialPublished={published}
        />
      )}
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<ApprovalsSkeleton />}>
      <ApprovalsData />
    </Suspense>
  );
}
