"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Megaphone, MonitorPlay, BarChart3,
  ClipboardCheck, Settings, ChevronLeft, Zap, Layers,
  Building2, LogOut, X, Image as ImageIcon, CalendarRange,
  Activity, History, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { useUser, useClerk } from "@clerk/nextjs";
import { NAV_ITEMS } from "@/types/rbac";
import { UserIcon } from "@/components/ui/user-icon";
import type { AccountType } from "@/types";
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

interface SidebarContentProps {
  onClose?: () => void;
  accountType: AccountType | null;
  platformRole: PlatformRole;
}

function SidebarContent({ onClose, accountType, platformRole }: SidebarContentProps) {
  const pathname = usePathname();
  const { toggleSidebar } = useAppStore();
  const { user } = useUser();
  const { signOut } = useClerk();
  const isMobile = !!onClose;

  const displayName = user?.fullName ?? user?.firstName ?? "Usuario";

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
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-3 h-12 border-b border-white/[0.06] flex-shrink-0">
        <div className="w-5 h-5 rounded-[5px] bg-[#B8EB23] flex items-center justify-center flex-shrink-0">
          <Zap className="w-3 h-3 text-black" strokeWidth={2.5} />
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-white/90 select-none">
          BelaBlaze
        </span>
        {isMobile && (
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="ml-auto p-1 text-white/30 hover:text-white/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-2">
        {sectionEntries.map(([sectionName, items], idx) => (
          <div key={sectionName}>
            {idx > 0 && (
              <div className="mx-3 my-2 border-t border-white/[0.06]" />
            )}
            {items.map((item) => {
              const active = isActive(item.href);
              const Icon = ICON_MAP[item.href] ?? Layers;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 py-1.5 px-3 w-full transition-colors duration-100",
                    active ? "text-white" : "text-white/50 hover:text-white/80",
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
                  <span className="text-[13px] font-normal truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-white/[0.06] p-3 flex items-center gap-2">
        <UserIcon size="sm" />
        <span className="text-[13px] text-white/70 truncate flex-1 min-w-0">
          {displayName}
        </span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="p-1.5 text-white/25 hover:text-white/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
          </button>
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              title="Ocultar menú"
              aria-label="Ocultar menú"
              className="p-1.5 text-white/25 hover:text-white/60 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>
          )}
        </div>
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
      {/* Hamburger — desktop only, visible when sidebar is collapsed */}
      <AnimatePresence>
        {sidebarCollapsed && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={toggleSidebar}
            aria-label="Mostrar menú"
            className="fixed top-0 left-0 z-40 hidden lg:flex items-center justify-center w-12 h-12 border-b border-r border-white/[0.06] text-white/40 hover:text-white/70 transition-colors bg-[#0a0a0a]"
          >
            <Menu className="w-4 h-4" strokeWidth={1.8} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 0 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden lg:flex flex-col h-screen bg-[#0a0a0a] border-r border-white/[0.06] flex-shrink-0 overflow-hidden z-30"
      >
        <SidebarContent accountType={accountType} platformRole={platformRole} />
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#0a0a0a] border-r border-white/[0.06] z-50 lg:hidden overflow-hidden"
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
