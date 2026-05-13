"use client";

import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Plus, ChevronRight, WifiOff, Command, Menu } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { NotificationCenter } from "@/components/ui/notification-center";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

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
  "/clients": { label: "Nuevo cliente", href: "/clients/new" },
};

export function Topbar() {
  const pathname = usePathname();
  const { isRealtime, setRealtime, unreadCount, setCommandOpen, toggleMobileSidebar } = useAppStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifBtnRef = useRef<HTMLButtonElement>(null);

  const currentPage = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key));
  const pageInfo = currentPage?.[1] ?? { title: "BelaBlaze", subtitle: "" };
  const actionConfig = Object.entries(actionConfigs).find(([key]) => pathname.startsWith(key));
  const action = actionConfig?.[1];

  return (
    <header className="h-14 lg:h-16 flex items-center justify-between px-4 lg:px-6 border-b border-white/[0.06] bg-[#0A0A0A]/90 backdrop-blur-xl flex-shrink-0 z-20 gap-3">
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-all flex-shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" strokeWidth={1.8} />
        </button>

        <div className="min-w-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/30 mb-0.5">
            <span>BelaBlaze</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">{pageInfo.title}</span>
          </div>
          <h1 className="text-[14px] lg:text-[15px] font-semibold text-white leading-none truncate">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1.5 lg:gap-2 flex-shrink-0">
        {/* Realtime indicator */}
        <button
          onClick={() => setRealtime(!isRealtime)}
          className={cn(
            "hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            isRealtime
              ? "bg-[#B8EB23]/10 text-[#B8EB23] border border-[#B8EB23]/20"
              : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white"
          )}
        >
          {isRealtime ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8EB23] animate-pulse" />
              En vivo
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              Pausado
            </>
          )}
        </button>

        {/* Search — triggers CMD+K palette */}
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white hover:border-white/10 transition-all text-xs min-w-[180px] group"
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0 group-hover:text-[#B8EB23] transition-colors" />
          <span>Buscar...</span>
          <div className="ml-auto flex items-center gap-0.5 text-white/20">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            ref={notifBtnRef}
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white hover:border-white/10 transition-all"
            aria-label="Notificaciones"
          >
            <Bell className="w-4 h-4" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold rounded-full bg-[#B8EB23] text-black">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationCenter
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            anchorRef={notifBtnRef as React.RefObject<HTMLElement>}
          />
        </div>

        {/* User menu */}
        <UserMenu />

        {/* Primary action */}
        {action && (
          <a
            href={action.href}
            className="hidden sm:flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg bg-[#B8EB23] text-black text-xs lg:text-sm font-semibold hover:bg-[#D4F564] transition-all shadow-[0_0_20px_rgba(184,235,35,0.2)] hover:shadow-[0_0_30px_rgba(184,235,35,0.35)]"
          >
            <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" strokeWidth={2.5} />
            <span className="hidden md:inline">{action.label}</span>
          </a>
        )}
      </div>
    </header>
  );
}
