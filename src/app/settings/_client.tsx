"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Bell, Shield, Palette, Globe, Zap,
  Save, Mail, Phone,
  Building2, Key, BadgeCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccountProfileCard, type OrgProfileView, type CreatorProfileView } from "@/components/settings/account-profile-card";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { UserRole, AccountType } from "@/types";

const SETTING_TABS = [
  { key: "profile", label: "Perfil", icon: <User className="w-4 h-4" /> },
  { key: "account", label: "Cuenta", icon: <BadgeCheck className="w-4 h-4" /> },
  { key: "notifications", label: "Notificaciones", icon: <Bell className="w-4 h-4" /> },
  { key: "security", label: "Seguridad", icon: <Shield className="w-4 h-4" /> },
  { key: "platform", label: "Plataforma", icon: <Palette className="w-4 h-4" /> },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "relative w-10 h-5.5 rounded-full transition-all flex-shrink-0",
        checked ? "bg-[#B8EB23]" : "bg-white/[0.1]"
      )}
      style={{ height: "22px" }}
    >
      <span className={cn(
        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
        checked ? "left-5" : "left-0.5"
      )} />
    </button>
  );
}

function SettingRow({ label, description, children }: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-white/[0.05] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export type SettingsClientProps = {
  role: UserRole;
  accountType: AccountType | null;
  organization: OrgProfileView;
  creator: CreatorProfileView;
};

export function SettingsClient({ role, accountType, organization, creator }: SettingsClientProps) {
  const { user, isLoaded } = useUser();
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  const roleLabel: Record<UserRole, string> = {
    ADMIN: "Administrador",
    EXECUTIVE: "Ejecutivo",
    COMPANY: "Empresa",
    CREATOR: "Creator",
    CLIENT: "Cliente",
  };

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
  });

  // Hydrate from Clerk once available — runs once when Clerk finishes loading
  useEffect(() => {
    if (!isLoaded || !user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile({
      name: user.fullName ?? user.firstName ?? "Usuario",
      email: user.primaryEmailAddress?.emailAddress ?? "",
      phone: user.primaryPhoneNumber?.phoneNumber ?? "",
      position: (user.publicMetadata as { position?: string })?.position ?? "",
    });
  }, [isLoaded, user]);

  const [notifs, setNotifs] = useState({
    approvals: true,
    campaigns: true,
    screens: false,
    weekly: true,
    realtime: true,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist into Clerk public metadata where supported
      if (user) {
        await user.update({
          firstName: profile.name.split(" ")[0],
          lastName: profile.name.split(" ").slice(1).join(" ") || undefined,
          unsafeMetadata: {
            ...user.unsafeMetadata,
            position: profile.position,
          },
        });
      }
      toast.success("Cambios guardados correctamente.");
    } catch {
      toast.error("No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-[780px] space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">Configuración</h2>
        <p className="text-xs text-white/40 mt-0.5">Gestiona tu perfil y preferencias de la plataforma</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        {SETTING_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              tab === t.key ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white"
            )}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {tab === "profile" && (
          <Card>
            <CardContent className="p-5 space-y-5">
              {/* Identity */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#B8EB23]/10 ring-1 ring-[#B8EB23]/20 flex items-center justify-center text-[#B8EB23] flex-shrink-0">
                  <User className="w-7 h-7" strokeWidth={1.6} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{profile.name || "Cargando..."}</p>
                  <Badge variant="brand" size="sm" className="mt-1">
                    {roleLabel[role] ?? "Usuario"}
                  </Badge>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Nombre completo", key: "name", icon: <User className="w-3.5 h-3.5" />, type: "text" },
                  { label: "Email", key: "email", icon: <Mail className="w-3.5 h-3.5" />, type: "email" },
                  { label: "Teléfono", key: "phone", icon: <Phone className="w-3.5 h-3.5" />, type: "tel" },
                  { label: "Cargo", key: "position", icon: <Building2 className="w-3.5 h-3.5" />, type: "text" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold text-white/50 flex items-center gap-1.5 mb-1.5">
                      {field.icon}
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={profile[field.key as keyof typeof profile]}
                      onChange={(e) => setProfile((p) => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-white/[0.06]">
                <Button variant="brand" size="sm" loading={saving} icon={<Save className="w-3.5 h-3.5" />} onClick={handleSave}>
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "account" && (
          <AccountProfileCard accountType={accountType} organization={organization} creator={creator} />
        )}

        {tab === "notifications" && (
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Alertas del sistema</p>
              <SettingRow label="Aprobaciones pendientes" description="Notificar cuando hay anuncios esperando revisión">
                <Toggle checked={notifs.approvals} onChange={() => setNotifs(n => ({ ...n, approvals: !n.approvals }))} />
              </SettingRow>
              <SettingRow label="Cambios en campañas" description="Actualizaciones de estado, pausas y finalización">
                <Toggle checked={notifs.campaigns} onChange={() => setNotifs(n => ({ ...n, campaigns: !n.campaigns }))} />
              </SettingRow>
              <SettingRow label="Estado de pantallas" description="Alertas cuando una pantalla se desconecta">
                <Toggle checked={notifs.screens} onChange={() => setNotifs(n => ({ ...n, screens: !n.screens }))} />
              </SettingRow>

              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 mt-5">Resúmenes</p>
              <SettingRow label="Reporte semanal" description="Resumen de rendimiento cada lunes">
                <Toggle checked={notifs.weekly} onChange={() => setNotifs(n => ({ ...n, weekly: !n.weekly }))} />
              </SettingRow>
              <SettingRow label="Métricas en tiempo real" description="Actualizaciones automáticas del dashboard">
                <Toggle checked={notifs.realtime} onChange={() => setNotifs(n => ({ ...n, realtime: !n.realtime }))} />
              </SettingRow>
            </CardContent>
          </Card>
        )}

        {tab === "security" && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <SettingRow label="Contraseña" description="Última actualización hace 3 meses">
                <Button variant="secondary" size="sm" icon={<Key className="w-3.5 h-3.5" />}>Cambiar</Button>
              </SettingRow>
              <SettingRow label="Autenticación 2FA" description="Protege tu cuenta con un segundo factor">
                <Badge variant="warning" size="sm">No configurado</Badge>
              </SettingRow>
              <SettingRow label="Sesiones activas" description="Gestiona dispositivos donde has iniciado sesión">
                <Button variant="outline" size="sm">Ver sesiones</Button>
              </SettingRow>

              <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs font-semibold text-white/60 mb-2">Último acceso</p>
                <div className="space-y-1.5">
                  {[
                    { device: "MacBook Pro — Chrome", location: "Medellín, Colombia", time: "Ahora" },
                    { device: "iPhone 16 — Safari", location: "Medellín, Colombia", time: "Hace 2 horas" },
                  ].map((s) => (
                    <div key={s.device} className="flex items-center justify-between text-xs">
                      <div>
                        <p className="text-white/70">{s.device}</p>
                        <p className="text-white/30">{s.location}</p>
                      </div>
                      <span className="text-white/40">{s.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "platform" && (
          <Card>
            <CardContent className="p-5 space-y-1">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Identidad BannerBlaze</p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#B8EB23] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">BelaBlaze Platform</p>
                  <p className="text-xs text-white/40">by BannerBlaze · v0.1.0</p>
                </div>
                <Badge variant="brand" size="sm" className="ml-auto">Beta</Badge>
              </div>
              <SettingRow label="Idioma" description="Español (Colombia)">
                <Button variant="outline" size="sm" icon={<Globe className="w-3.5 h-3.5" />}>ES · CO</Button>
              </SettingRow>
              <SettingRow label="Zona horaria" description="America/Bogota (UTC-5)">
                <span className="text-xs text-white/50">UTC-5</span>
              </SettingRow>
              <SettingRow label="Moneda de visualización" description="Peso colombiano (COP)">
                <span className="text-xs text-white/50">COP $</span>
              </SettingRow>
              <SettingRow label="Modo compacto" description="Reduce el espaciado en tablas y listas">
                <Toggle checked={false} onChange={() => {}} />
              </SettingRow>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
