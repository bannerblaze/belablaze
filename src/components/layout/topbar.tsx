"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Bell, Plus, ChevronRight, WifiOff, Command } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useAppStore } from "@/store";
import { mockRecentActivity } from "@/lib/mock-data";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Visión general de la plataforma" },
  "/campaigns": { title: "Campañas", subtitle: "Gestión de campañas publicitarias" },
  "/ads": { title: "Anuncios", subtitle: "Administración de creatividades y spots" },
  "/screens": { title: "Pantallas DOOH", subtitle: "Estado y gestión de pantallas digitales" },
  "/analytics": { title: "Analytics", subtitle: "Métricas e insights de rendimiento" },
  "/approvals": { title: "Aprobaciones", subtitle: "Workflow de revisión de anuncios" },
  "/clients": { title: "Clientes", subtitle: "Gestión de cuentas y empresas" },
  "/settings": { title: "Configuración", subtitle: "Preferencias de la plataforma" },
};

const actionConfigs: Record<string, { label: string; href: string }> = {
  "/campaigns": { label: "Nueva campaña", href: "/campaigns/new" },
  "/ads": { label: "Nuevo anuncio", href: "/ads/new" },
  "/screens": { label: "Nueva pantalla", href: "/screens/new" },
  "/clients": { label: "Nuevo cliente", href: "/clients/new" },
};

export function Topbar() {
  const pathname = usePathname();
  const { isRealtime, setRealtime, unreadCount, notifications, markAllRead } = useAppStore();
  const [notifOpen, setNotifOpen] = useState(false);

  const currentPage = Object.entries(pageTitles).find(([key]) =>
    pathname.startsWith(key)
  );
  const pageInfo = currentPage?.[1] ?? { title: "BelaBlaze", subtitle: "" };
  const actionConfig = Object.entries(actionConfigs).find(([key]) => pathname.startsWith(key));
  const action = actionConfig?.[1];

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl flex-shrink-0 z-20 gap-4">
      {/* Left: Breadcrumb + Title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-white/30 mb-0.5">
            <span>BelaBlaze</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">{pageInfo.title}</span>
          </div>
          <h1 className="text-[15px] font-semibold text-white leading-none">{pageInfo.title}</h1>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Realtime toggle */}
        <button
          onClick={() => setRealtime(!isRealtime)}
          className={cn(
            "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            isRealtime
              ? "bg-[#B8EB23]/10 text-[#B8EB23] border border-[#B8EB23]/20"
              : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white"
          )}
        >
          {isRealtime ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8EB23] animate-pulse-brand" />
              En vivo
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              Pausado
            </>
          )}
        </button>

        {/* Search */}
        <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white hover:border-white/10 transition-all text-xs min-w-[180px]">
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Buscar...</span>
          <div className="ml-auto flex items-center gap-0.5 text-white/20">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white hover:border-white/10 transition-all"
          >
            <Bell className="w-4 h-4" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold rounded-full bg-[#B8EB23] text-black">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-[#141414] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <span className="text-sm font-semibold text-white">Notificaciones</span>
                  <button onClick={markAllRead} className="text-xs text-[#B8EB23] hover:text-[#D4F564] transition-colors">
                    Marcar todo leído
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {mockRecentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                          activity.action === "APPROVE" ? "bg-green-400" :
                          activity.action === "REJECT" ? "bg-red-400" :
                          activity.action === "CREATE" ? "bg-[#B8EB23]" :
                          "bg-orange-400"
                        )} />
                        <div className="min-w-0">
                          <p className="text-[13px] text-white font-medium leading-snug">
                            {activity.action === "APPROVE" ? "Anuncio aprobado" :
                             activity.action === "REJECT" ? "Anuncio rechazado" :
                             activity.action === "CREATE" ? "Nuevo elemento creado" :
                             "Elemento actualizado"}
                          </p>
                          <p className="text-xs text-white/40 mt-0.5 truncate">{activity.entityName}</p>
                          <p className="text-[11px] text-white/25 mt-1">{formatRelativeTime(activity.time)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 text-center">
                  <button className="text-xs text-white/40 hover:text-white transition-colors">
                    Ver todas las notificaciones
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* User menu */}
        <UserMenu />

        {/* Primary action */}
        {action && (
          <a
            href={action.href}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8EB23] text-black text-sm font-semibold hover:bg-[#D4F564] transition-all shadow-[0_0_20px_rgba(184,235,35,0.2)] hover:shadow-[0_0_30px_rgba(184,235,35,0.35)]"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            {action.label}
          </a>
        )}
      </div>
    </header>
  );
}
