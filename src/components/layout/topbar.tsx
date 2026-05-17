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
  "/historial": { title: "Historial", subtitle: "Línea de tiempo de la cuenta" },
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
    <header className="h-14 lg:h-[56px] flex items-center justify-between px-4 lg:px-5 border-b border-white/[0.05] bg-[#070708]/85 backdrop-blur-xl flex-shrink-0 z-20 gap-3">
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/55 hover:text-white hover:bg-white/[0.05] transition-all flex-shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" strokeWidth={1.8} />
        </button>

        <div className="min-w-0 flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/30 font-medium">
            <span>BelaBlaze</span>
            <ChevronRight className="w-3 h-3" />
          </div>
          <h1 className="text-[14px] font-semibold text-white leading-none truncate tracking-tight">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Realtime indicator */}
        <button
          onClick={() => setRealtime(!isRealtime)}
          className={cn(
            "hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
            isRealtime
              ? "bg-[#B8EB23]/[0.08] text-[#B8EB23] ring-1 ring-[#B8EB23]/15"
              : "bg-white/[0.03] text-white/45 ring-1 ring-white/[0.06] hover:text-white hover:bg-white/[0.05]",
          )}
        >
          {isRealtime ? (
            <>
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-[#B8EB23] animate-ping opacity-60" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-[#B8EB23]" />
              </span>
              En vivo
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Pausado
            </>
          )}
        </button>

        {/* Search — triggers CMD+K palette */}
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden lg:inline-flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-lg bg-white/[0.03] ring-1 ring-white/[0.06] text-white/45 hover:text-white hover:ring-white/[0.12] hover:bg-white/[0.05] transition-all text-xs min-w-[220px] group"
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-medium">Buscar...</span>
          <div className="ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.05] text-white/40 text-[10px] font-mono">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            ref={notifBtnRef}
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-lg bg-white/[0.03] ring-1 ring-white/[0.06] text-white/55 hover:text-white hover:ring-white/[0.12] hover:bg-white/[0.05] transition-all"
            aria-label="Notificaciones"
          >
            <Bell className="w-[15px] h-[15px]" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-full bg-[#B8EB23] text-black ring-2 ring-[#070708]">
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

        {/* Vertical divider before primary action */}
        {action && <div className="hidden sm:block w-px h-5 bg-white/[0.08] mx-1" />}

        {/* Primary action */}
        {action && (
          <a
            href={action.href}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 lg:px-3.5 py-2 rounded-lg bg-[#B8EB23] text-black text-xs lg:text-[13px] font-semibold hover:bg-[#C5F034] active:bg-[#A5D820] transition-all shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_0_20px_-2px_rgba(184,235,35,0.35)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_0_28px_0_rgba(184,235,35,0.5)]"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="hidden md:inline">{action.label}</span>
          </a>
        )}
      </div>
    </header>
  );
}
