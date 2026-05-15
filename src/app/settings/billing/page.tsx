import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { getCurrentSubscription, getUsage } from "@/actions/billing";
import { SettingsShell } from "@/components/settings/settings-shell";
import { BillingClient } from "./_client";

export default async function BillingPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const [sub, usage] = await Promise.all([getCurrentSubscription(), getUsage()]);

  return (
    <SettingsShell>
      <BillingClient
        status={sub.status}
        currentPeriodEnd={sub.currentPeriodEnd.toISOString()}
        trialEndsAt={sub.trialEndsAt?.toISOString() ?? null}
        usage={usage}
      />
    </SettingsShell>
  );
}
