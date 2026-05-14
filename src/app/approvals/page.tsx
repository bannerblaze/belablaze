import { Suspense } from "react";
import { connection } from "next/server";
import { ApprovalsClient } from "./_client";
import { NoPermissionEmpty } from "@/components/ui/empty-state";
import { getOrgContext } from "@/lib/org-context";
import { can, ORG_ROLE_LABELS } from "@/lib/rbac";

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

  // Permission gate uses the FASE 6 OrgRole RBAC matrix. Non-approvers
  // get an elegant restricted screen labelled with their current role.
  const ctx = await getOrgContext();

  if (!ctx) {
    return (
      <div className="p-6 max-w-[900px]">
        <NoPermissionEmpty
          title="Inicia sesión para continuar"
          description="Necesitas estar autenticado y pertenecer a una organización."
        />
      </div>
    );
  }

  if (!can(ctx.role, "ads:approve")) {
    return (
      <div className="p-6 max-w-[900px]">
        <NoPermissionEmpty currentRole={ORG_ROLE_LABELS[ctx.role]} />
      </div>
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
