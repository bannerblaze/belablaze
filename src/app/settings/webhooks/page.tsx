import { redirect } from "next/navigation";
import { Webhook } from "lucide-react";
import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SettingsShell } from "@/components/settings/settings-shell";

const SUPPORTED_EVENTS = [
  "campaign.created", "campaign.approved", "campaign.completed",
  "ad.approved", "ad.rejected",
  "member.joined", "member.left",
  "media.uploaded",
];

export default async function WebhooksPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const hooks = await db.webhook.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <SettingsShell>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Webhook className="w-4 h-4 text-[#B8EB23]" />
            Webhooks
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Recibe eventos de BelaBlaze en tus endpoints HTTP</p>
        </div>

        <Card>
          <CardHeader title={`${hooks.length} ${hooks.length === 1 ? "endpoint" : "endpoints"}`} subtitle="Configura URLs que reciben eventos en tiempo real" />
          <CardContent className="py-3">
            {hooks.length === 0 ? (
              <p className="text-xs text-white/30 py-6 text-center">Aún no has registrado webhooks.</p>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {hooks.map((h) => (
                  <div key={h.id} className="py-3">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <code className="text-xs text-white font-mono truncate">{h.url}</code>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        h.isActive ? "bg-[#B8EB23]/10 text-[#B8EB23]" : "bg-white/[0.04] text-white/40"
                      }`}>
                        {h.isActive ? "Activo" : "Pausado"}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40">
                      {h.events.length} eventos · {h.lastTriggeredAt ? `Último ping ${new Date(h.lastTriggeredAt).toLocaleString("es-CO")}` : "Sin pings aún"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Eventos soportados" subtitle="Suscríbete a los que necesites" />
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_EVENTS.map((e) => (
                <code key={e} className="text-[11px] text-white/60 font-mono px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
                  {e}
                </code>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsShell>
  );
}
