"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Megaphone, MonitorPlay, BarChart3,
  ClipboardCheck, Settings, ChevronLeft, Zap, Layers,
  Building2, LogOut, X, Image as ImageIcon, CalendarRange,
  Activity, History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRole } from "@/hooks/use-role";
import { NAV_ITEMS } from "@/types/rbac";
import type { UserRole, AccountType } from "@/types";
import type { PlatformRole } from "@/lib/platform";

const ICON_MAP: Record<string, React.ElementType> = {
  "/dashboard":          LayoutDashboard,
  "/campaigns":          Layers,
  "/campaigns/calendar": CalendarRange,
  "/historial":          History,
  "/ads":                Megaphone,
  "/media":              ImageIcon,
  "/screens":            MonitorPlay,
  "/analytics":          BarChart3,
  "/approvals":          ClipboardCheck,
  "/clients":            Building2,
  "/settings":           Settings,
  "/settings/activity":  Activity,
};

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN:     "Administrador",
  EXECUTIVE: "Ejecutivo",
  COMPANY:   "Empresa",
  CREATOR:   "Creator",
  CLIENT:    "Cliente",
};

interface SidebarContentProps {
  onClose?: () => void;
  accountType: AccountType | null;
  platformRole: PlatformRole;
}

function SidebarContent({ onClose, accountType, platformRole }: SidebarContentProps) {
  const pathname  = usePathname();
  const { toggleSidebar } = useAppStore();
  const { user }  = useUser();
  const { signOut } = useClerk();
  const role      = useRole() ?? "EXECUTIVE";
  const isMobile  = !!onClose;

  const displayName = user?.fullName ?? user?.firstName ?? "Usuario";
  const initial     = displayName.charAt(0).toUpperCase();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const isPlatformStaff = platformRole === "SUPER_ADMIN" || platformRole === "SUPPORT";
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (platformRole === "SUPER_ADMIN") return true;
    if (item.platformOnly && !isPlatformStaff) return false;
    if (item.allowedAccountTypes && accountType
        && !item.allowedAccountTypes.includes(accountType)) return false;
    return true;
  });

  const sectionEntries = Object.entries(
    visibleItems.reduce<Record<string, typeof visibleItems>>((acc, item) => {
      const key = item.section ?? "Principal";
      (acc[key] ||= []).push(item);
      return acc;
    }, {}),
  );

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.05] flex-shrink-0">
        <div className="w-8 h-8 rounded-[10px] bg-[#B8EB23] flex items-center justify-center flex-shrink-0 shadow-[0_0_0_1px_rgba(255,255,255,0.2)_inset,0_0_18px_-2px_rgba(184,235,35,0.4)]">
          <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none flex-1 min-w-0">
          <span className="text-[14px] font-bold tracking-tight text-white">
            Bela<span className="text-[#B8EB23]">Blaze</span>
          </span>
          <span className="text-[10px] text-white/30 tracking-[0.1em] uppercase mt-1">
            by BannerBlaze
          </span>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {sectionEntries.map(([sectionName, items], idx) => (
          <div key={sectionName}>
            <p className={cn(
              "px-4 text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1",
              idx > 0 ? "mt-5" : "mt-1",
            )}>
              {sectionName}
            </p>
            <div className="space-y-1">
              {items.map((item) => {
                const active = isActive(item.href);
                const Icon = ICON_MAP[item.href] ?? Layers;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "relative flex items-center py-2.5 px-4 gap-3 transition-colors duration-150 overflow-hidden",
                      active
                        ? "rounded-r-md text-white"
                        : "rounded-md text-white/55 hover:text-white/80 hover:bg-white/[0.04]",
                    )}
                  >
                    {active && (
                      <>
                        <span className="absolute inset-0 bg-white/[0.07]" />
                        <span className="absolute left-0 inset-y-0 w-[2px] bg-[#B8EB23]" />
                      </>
                    )}
                    <Icon
                      className="relative z-10 w-4 h-4 flex-shrink-0"
                      strokeWidth={active ? 2.1 : 1.7}
                    />
                    <span className="relative z-10 text-sm truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-white/[0.08] flex-shrink-0">
        {/* User row */}
        <div className="flex items-center gap-3 p-4">
          <div className="w-8 h-8 rounded-full bg-[#B8EB23]/20 border border-[#B8EB23]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-[#B8EB23] text-[13px] font-medium leading-none">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-white/80 truncate leading-none">{displayName}</p>
            <p className="text-[11px] text-white/35 mt-1 truncate">{ROLE_LABEL[role] ?? role}</p>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex-shrink-0 p-1.5 text-white/30 hover:text-white/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Collapse row */}
        {!isMobile && (
          <div className="border-t border-white/[0.05] px-2 py-1.5">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-white/25 hover:text-white/50 hover:bg-white/[0.03] transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
              <span className="text-[11px]">Ocultar menú</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface SidebarProps {
  accountType?: AccountType | null;
  platformRole?: PlatformRole;
}

export function Sidebar({
  accountType = null,
  platformRole = "USER",
}: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 0 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden lg:flex flex-col h-screen bg-[#0A0A0C] border-r border-white/[0.05] flex-shrink-0 overflow-hidden z-30"
      >
        <SidebarContent accountType={accountType} platformRole={platformRole} />
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#0A0A0C] border-r border-white/[0.05] z-50 lg:hidden overflow-hidden"
            >
              <SidebarContent
                accountType={accountType}
                platformRole={platformRole}
                onClose={() => setMobileSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
