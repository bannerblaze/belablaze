import { redirect } from "next/navigation";
import { Shield, KeyRound, Smartphone, History } from "lucide-react";
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
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#B8EB23]" />
            Seguridad
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Control de acceso, sesiones y políticas de la organización</p>
        </div>

        <Card>
          <CardHeader title="Autenticación de dos factores" subtitle="Refuerza tu cuenta con códigos temporales" icon={<KeyRound className="w-4 h-4" />} />
          <CardContent className="py-3">
            <p className="text-xs text-white/40">
              La 2FA se gestiona desde Clerk. <a href="https://accounts.clerk.com/" target="_blank" rel="noreferrer" className="text-[#B8EB23] hover:underline">Abrir panel de Clerk →</a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Sesiones activas" subtitle="Dispositivos donde tu cuenta está iniciada" icon={<Smartphone className="w-4 h-4" />} />
          <CardContent className="py-3">
            <p className="text-xs text-white/40">Pronto podrás revocar sesiones desde aquí.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Política de invitaciones" subtitle="Quién puede invitar miembros y bajo qué condiciones" icon={<History className="w-4 h-4" />} />
          <CardContent className="py-3 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">Permitir invitaciones por OWNER + ADMIN</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#B8EB23]/10 text-[#B8EB23]">Activo</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">Expiración de invitaciones</span>
              <span className="text-white font-semibold">7 días</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">Whitelist de dominios</span>
              <span className="text-white/40">Configurable en .env</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsShell>
  );
}
