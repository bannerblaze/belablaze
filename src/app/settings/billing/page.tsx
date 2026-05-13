import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { getCurrentSubscription, getUsage } from "@/actions/billing";
import { PLAN_LIMITS, PLAN_DETAILS } from "@/lib/plans";
import { SettingsShell } from "@/components/settings/settings-nav";
import { BillingClient } from "./_client";

export default async function BillingPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const [sub, usage] = await Promise.all([getCurrentSubscription(), getUsage()]);

  return (
    <SettingsShell>
      <BillingClient
        currentPlan={sub.plan}
        status={sub.status}
        currentPeriodEnd={sub.currentPeriodEnd.toISOString()}
        trialEndsAt={sub.trialEndsAt?.toISOString() ?? null}
        usage={usage}
        canManage={ctx.role === "OWNER" || ctx.role === "ADMIN"}
        limits={PLAN_LIMITS}
        plans={PLAN_DETAILS}
      />
    </SettingsShell>
  );
}
