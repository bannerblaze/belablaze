import { Suspense } from "react";
import { connection } from "next/server";
import { ApprovalsClient } from "./_client";
import { NoPermissionEmpty } from "@/components/ui/empty-state";
import { checkPermissions } from "@/lib/auth";

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

  // Permission gate — provisions DB user lazily on first call and resolves role
  // from Clerk metadata + DB. In dev, falls back to ADMIN so local devs don't
  // get locked out. Non-approvers get an elegant restricted screen.
  const { user, canApprove } = await checkPermissions();

  if (!user) {
    // Server component: at this point Clerk middleware should have redirected,
    // but in case it didn't, render the same restricted view.
    return (
      <div className="p-6 max-w-[900px]">
        <NoPermissionEmpty
          title="Inicia sesión para continuar"
          description="Necesitas estar autenticado para acceder al panel de aprobaciones."
        />
      </div>
    );
  }

  if (!canApprove) {
    return (
      <div className="p-6 max-w-[900px]">
        <NoPermissionEmpty currentRole={user.role} />
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
