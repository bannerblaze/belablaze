import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { listAuditLogs } from "@/actions/audit";
import { HistorialClient } from "./_client";

/* /historial — line de tiempo de la cuenta.
 *
 * Surfaces the same audit-log data that powers /settings/activity, but
 * presented as a vertical timeline at the top-level navigation. Per-
 * account history (each org sees only its own events). Read-only. */

async function HistorialData({ searchParams }: { searchParams: Promise<{ entityType?: string }> }) {
  await connection();

  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const sp = await searchParams;
  const data = await listAuditLogs({
    organizationId: ctx.organizationId,
    page: 1,
    entityType: sp.entityType,
  });

  return (
    <HistorialClient
      items={data.items.map((i) => ({
        id: i.id,
        action: i.action,
        entityType: i.entityType,
        entityId: i.entityId,
        metadata: i.metadata,
        createdAt: i.createdAt.toISOString(),
        user: i.user ? { name: i.user.name, email: i.user.email } : null,
      }))}
      total={data.total}
    />
  );
}

function HistorialSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-5 max-w-[1000px]">
      <div className="h-9 w-64 rounded-lg bg-white/[0.04] animate-pulse" />
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-white/[0.02] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function HistorialPage({
  searchParams,
}: { searchParams: Promise<{ entityType?: string }> }) {
  return (
    <Suspense fallback={<HistorialSkeleton />}>
      <HistorialData searchParams={searchParams} />
    </Suspense>
  );
}
