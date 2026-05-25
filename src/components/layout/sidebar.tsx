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
import { useRole } from "@/hooks/use-role";
import { NAV_ITEMS } from "@/types/rbac";
import { UserIcon } from "@/components/ui/user-icon";
import type { UserRole, AccountType } from "@/types";
import type { PlatformRole } from "@/lib/platform";

/* Maps NAV_ITEMS hrefs → lucide components so the existing icon rendering
 * is preserved while nav config lives centrally in src/types/rbac.ts. */
const ICON_MAP: Record<string, React.ElementType> = {
  "/dashboard":            LayoutDashboard,
  "/campaigns":            Layers,
  "/campaigns/calendar":   CalendarRange,
  "/historial":            History,
  "/ads":                  Megaphone,
  "/media":                ImageIcon,
  "/screens":              MonitorPlay,
  "/analytics":            BarChart3,
  "/approvals":            ClipboardCheck,
  "/clients":              Building2,
  "/settings":             Settings,
  "/settings/activity":    Activity,
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
  const role = useRole() ?? "EXECUTIVE";

  const roleLabel: Record<UserRole, string> = {
    ADMIN: "Administrador",
    EXECUTIVE: "Ejecutivo",
    COMPANY: "Empresa",
    CREATOR: "Creator",
    CLIENT: "Cliente",
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  /* Visibility = (no AccountType restriction OR account matches)
   *           AND (not platformOnly OR user is platform staff).
   * SUPER_ADMIN bypasses every filter for support work. */
  const isPlatformStaff = platformRole === "SUPER_ADMIN" || platformRole === "SUPPORT";
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (platformRole === "SUPER_ADMIN") return true;
    if (item.platformOnly && !isPlatformStaff) return false;
    if (item.allowedAccountTypes && accountType
        && !item.allowedAccountTypes.includes(accountType)) {
      return false;
    }
    return true;
  });

  // Group items by section, preserving order
  const sections = visibleItems.reduce<Record<string, typeof visibleItems>>((acc, item) => {
    const key = item.section ?? "Principal";
    (acc[key] ||= []).push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.05] flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-[#B8EB23] flex-shrink-0 shadow-[0_0_0_1px_rgba(255,255,255,0.2)_inset,0_0_18px_-2px_rgba(184,235,35,0.4)]">
          <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none flex-1 min-w-0">
          <span className="text-[14px] font-bold tracking-tight text-white">
            Bela<span className="text-[#B8EB23]">Blaze</span>
          </span>
          <span className="text-[9px] text-white/35 tracking-[0.12em] uppercase font-semibold mt-1">
            by BannerBlaze
          </span>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {Object.entries(sections).map(([sectionName, items], sectionIndex) => (
          <div key={sectionName}>
            <h4 className={cn(
              "px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35",
              sectionIndex > 0 && "mt-6",
            )}>
              {sectionName}
            </h4>
            <div className="space-y-0.5">
              {items.map((item) => {
                const active = isActive(item.href);
                const Icon = ICON_MAP[item.href] ?? Layers;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "relative flex items-center h-9 px-3 gap-[10px] cursor-pointer group transition-colors duration-150 overflow-hidden",
                      active
                        ? "rounded-r-lg text-[#B8EB23]"
                        : "rounded-lg text-white/55 hover:text-white hover:bg-white/[0.05]",
                    )}
                  >
                    {/* Active: background fill + left border */}
                    {active && (
                      <>
                        <span className="absolute inset-0 bg-[#B8EB23]/[0.10]" />
                        <span className="absolute left-0 inset-y-0 w-[2px] bg-[#B8EB23]" />
                      </>
                    )}

                    {/* Icon */}
                    <div className="relative z-10 flex-shrink-0">
                      <Icon
                        className={cn("w-[18px] h-[18px]", active ? "text-[#B8EB23]" : "")}
                        strokeWidth={active ? 2.2 : 1.7}
                      />
                      {item.badge && !isMobile && (
                        <span className="absolute -top-1 -right-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-1 text-[8px] font-bold rounded-full bg-[#B8EB23] text-black leading-none">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    <div className="relative z-10 flex items-center justify-between flex-1 min-w-0">
                      <span className={cn(
                        "text-[13px] truncate",
                        active ? "font-[500]" : "font-[400]",
                      )}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="flex-shrink-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-md bg-[#B8EB23] text-black leading-none">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.08] py-4 px-3 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all group">
          <UserIcon size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate leading-none">{displayName}</p>
            <p className="text-[11px] text-white/[0.45] mt-1 truncate">{roleLabel[role] ?? role}</p>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex-shrink-0 p-1.5 rounded-md text-white/25 hover:text-red-400 hover:bg-red-400/[0.08] transition-all"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
          </button>
        </div>

        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
          >
            <ChevronLeft className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
            <span className="text-[11px] font-medium">Ocultar menú</span>
          </button>
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
      {/* Fixed hamburger — desktop only, appears when sidebar is hidden */}
      <AnimatePresence>
        {sidebarCollapsed && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={toggleSidebar}
            aria-label="Mostrar menú"
            className="fixed top-0 left-0 z-40 hidden lg:flex items-center justify-center w-12 h-[56px] bg-[#070708]/85 backdrop-blur-xl border-b border-r border-white/[0.05] text-white/45 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Menu className="w-[18px] h-[18px]" strokeWidth={1.8} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 0 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden lg:flex flex-col h-screen bg-[#0A0A0C] border-r border-white/[0.05] flex-shrink-0 overflow-hidden z-30"
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
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="fixed left-0 top-0 bottom-0 w-[272px] bg-[#0A0A0C] border-r border-white/[0.05] z-50 lg:hidden overflow-hidden"
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
