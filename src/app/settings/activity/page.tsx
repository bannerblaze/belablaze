import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { checkEnterpriseAccess } from "@/lib/limits";
import { listAuditLogs } from "@/actions/audit";
import { SettingsShell } from "@/components/settings/settings-shell";
import { ActivityClient } from "./_client";
import { can } from "@/lib/rbac";

export default async function ActivityPage({
  searchParams,
}: { searchParams: Promise<{ page?: string; action?: string; entityType?: string }> }) {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");
  if (!can(ctx.role, "audit:view")) redirect("/settings");

  // Audit log is an enterprise-only surface for ORGANIZATION/INTERNAL
  // accounts with a plan that includes auditLog. Creators can't reach
  // this even on a paid plan.
  const blocked = await checkEnterpriseAccess(ctx.organizationId, "auditLog");
  if (blocked) redirect(blocked);

  const sp = await searchParams;
  const data = await listAuditLogs({
    organizationId: ctx.organizationId,
    page: Number(sp.page ?? "1"),
    action: sp.action,
    entityType: sp.entityType,
  });

  return (
    <SettingsShell>
      <ActivityClient
        items={data.items.map((i) => ({
          id: i.id,
          action: i.action,
          entityType: i.entityType,
          entityId: i.entityId,
          metadata: i.metadata,
          ip: i.ip,
          userAgent: i.userAgent,
          createdAt: i.createdAt.toISOString(),
          user: i.user ? { id: i.user.id, name: i.user.name, email: i.user.email, avatar: i.user.avatar } : null,
        }))}
        total={data.total}
        page={data.page}
        totalPages={data.totalPages}
      />
    </SettingsShell>
  );
}
