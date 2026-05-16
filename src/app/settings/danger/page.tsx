import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { requireOrgContext } from "@/lib/org-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SettingsShell } from "@/components/settings/settings-shell";
import { DangerClient } from "./_client";

export default async function DangerPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  return (
    <SettingsShell>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Zona peligrosa
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Acciones irreversibles que afectan a toda la organización</p>
        </div>

        <Card className="border-red-400/20">
          <CardHeader title="Eliminar organización" subtitle="Borra esta organización y toda su data. Esta acción no se puede deshacer." />
          <CardContent>
            <DangerClient
              organizationId={ctx.organizationId}
              organizationName={ctx.organizationName}
              isOwner={true}
            />
          </CardContent>
        </Card>
      </div>
    </SettingsShell>
  );
}
