import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { requireOrgContext } from "@/lib/org-context";
import { SettingsShell } from "@/components/settings/settings-shell";
import { SecurityClient } from "./_client";

export default async function SecurityPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  return (
    <SettingsShell>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2 tracking-tight">
            <Shield className="w-4 h-4 text-[#B8EB23]" />
            Seguridad
          </h2>
          <p className="text-xs text-white/40 mt-1">Control de acceso y sesiones de tu cuenta</p>
        </div>

        <SecurityClient />
      </div>
    </SettingsShell>
  );
}
