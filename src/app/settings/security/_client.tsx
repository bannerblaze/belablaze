"use client";

import { useClerk, useSessionList, useSession } from "@clerk/nextjs";
import { KeyRound, Monitor, Shield } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SecurityClient() {
  const { openUserProfile } = useClerk();
  const { session: currentSession } = useSession();
  const { sessions, isLoaded } = useSessionList();

  return (
    <div className="space-y-4">
      {/* Password */}
      <Card>
        <CardHeader
          title="Contraseña"
          subtitle="Cambia la contraseña de tu cuenta"
          icon={<KeyRound className="w-4 h-4" />}
          action={
            <button
              onClick={() => openUserProfile()}
              className="text-[11px] font-semibold text-black bg-[#B8EB23] hover:bg-[#B8EB23]/90 px-3 py-1.5 rounded-lg transition-colors"
            >
              Cambiar contraseña
            </button>
          }
        />
        <CardContent className="pt-3">
          <p className="text-xs text-white/40 leading-relaxed">
            Al hacer clic se abre el panel de Clerk donde puedes actualizar tu contraseña de forma segura.
          </p>
        </CardContent>
      </Card>

      {/* Active sessions */}
      <Card>
        <CardHeader
          title="Sesiones activas"
          subtitle="Dispositivos donde tu cuenta está iniciada"
          icon={<Monitor className="w-4 h-4" />}
        />
        <CardContent className="pt-3">
          {!isLoaded ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-10 bg-white/[0.03] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <p className="text-xs text-white/40">No hay sesiones activas.</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {sessions.map((s) => {
                const isCurrent = s.id === currentSession?.id;
                return (
                  <div key={s.id} className="flex items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">
                        {s.publicUserData.identifier}
                      </p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {`Activa ${new Date(s.lastActiveAt).toLocaleString("es-CO")}`}
                      </p>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#B8EB23]/10 text-[#B8EB23] shrink-0">
                        Sesión actual
                      </span>
                    ) : (
                      <button
                        onClick={() => s.end()}
                        className="text-[11px] text-red-400 hover:text-red-300 transition-colors shrink-0"
                      >
                        Cerrar sesión
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader
          title="Autenticación en dos pasos"
          subtitle="Añade una capa extra de seguridad con códigos temporales"
          icon={<Shield className="w-4 h-4" />}
          action={
            <button
              onClick={() => openUserProfile()}
              className="text-[11px] font-semibold text-black bg-[#B8EB23] hover:bg-[#B8EB23]/90 px-3 py-1.5 rounded-lg transition-colors"
            >
              Configurar 2FA
            </button>
          }
        />
        <CardContent className="pt-3">
          <p className="text-xs text-white/40 leading-relaxed">
            Activa o desactiva la verificación en dos pasos desde el panel de Clerk.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
