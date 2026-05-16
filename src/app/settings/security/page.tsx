import { redirect } from "next/navigation";
import { Shield, KeyRound, Smartphone } from "lucide-react";
import { requireOrgContext } from "@/lib/org-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SettingsShell } from "@/components/settings/settings-shell";

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

        <Card>
          <CardHeader title="Autenticación de dos factores" subtitle="Refuerza tu cuenta con códigos temporales" icon={<KeyRound className="w-4 h-4" />} />
          <CardContent className="pt-3">
            <p className="text-xs text-white/45 leading-relaxed">
              La 2FA se gestiona desde Clerk.{" "}
              <a href="https://accounts.clerk.com/" target="_blank" rel="noreferrer" className="text-[#B8EB23] hover:underline">
                Abrir panel de Clerk →
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Sesiones activas" subtitle="Dispositivos donde tu cuenta está iniciada" icon={<Smartphone className="w-4 h-4" />} />
          <CardContent className="pt-3">
            <p className="text-xs text-white/45 leading-relaxed">Pronto podrás revocar sesiones desde aquí.</p>
          </CardContent>
        </Card>
      </div>
    </SettingsShell>
  );
}
