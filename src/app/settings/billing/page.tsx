import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { SettingsShell } from "@/components/settings/settings-shell";
import { BillingClient } from "./_client";

export default async function BillingPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  return (
    <SettingsShell>
      <BillingClient />
    </SettingsShell>
  );
}
