import { redirect } from "next/navigation";
import { Webhook } from "lucide-react";
import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { checkAccountTypeAccess } from "@/lib/access";
import { SettingsShell } from "@/components/settings/settings-shell";
import { WebhooksClient } from "./_client";

export default async function WebhooksPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const blocked = await checkAccountTypeAccess(["ORGANIZATION", "INTERNAL"]);
  if (blocked) redirect(blocked);

  const hooks = await db.webhook.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      lastTriggeredAt: true,
      createdAt: true,
    },
  });

  const serialized = hooks.map((h) => ({
    ...h,
    lastTriggeredAt: h.lastTriggeredAt?.toISOString() ?? null,
    createdAt: h.createdAt.toISOString(),
  }));

  return (
    <SettingsShell>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Webhook className="w-4 h-4 text-[#B8EB23]" />
            Webhooks
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Recibe eventos de BelaBlaze en tus endpoints HTTP
          </p>
        </div>

        <WebhooksClient hooks={serialized} />
      </div>
    </SettingsShell>
  );
}
