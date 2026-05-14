import { redirect } from "next/navigation";
import { Code2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { checkEnterpriseAccess } from "@/lib/limits";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SettingsShell } from "@/components/settings/settings-shell";

export default async function ApiKeysPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const blocked = await checkEnterpriseAccess(ctx.organizationId, "apiKeys");
  if (blocked) redirect(blocked);

  const keys = await db.apiKey.findMany({
    where: { organizationId: ctx.organizationId, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <SettingsShell>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#B8EB23]" />
            API Keys
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Tokens para integrar BelaBlaze con tus sistemas</p>
        </div>

        <Card>
          <CardHeader
            title={`${keys.length} ${keys.length === 1 ? "clave activa" : "claves activas"}`}
            subtitle="Las claves se muestran sólo al momento de crear — guárdalas en un lugar seguro"
          />
          <CardContent className="py-3">
            {keys.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-white/40 mb-4">Aún no has generado claves API</p>
                <p className="text-xs text-white/30">La generación de claves estará disponible en la próxima versión.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {keys.map((k) => (
                  <div key={k.id} className="flex items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{k.name}</p>
                      <p className="text-xs text-white/40 font-mono">{k.keyPrefix}···</p>
                    </div>
                    <span className="text-[11px] text-white/30">
                      {k.lastUsedAt ? `Usado ${new Date(k.lastUsedAt).toLocaleDateString("es-CO")}` : "Nunca usado"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SettingsShell>
  );
}
