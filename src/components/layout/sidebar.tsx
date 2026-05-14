"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Megaphone, MonitorPlay, BarChart3,
  ClipboardCheck, Settings, ChevronLeft, Zap, Layers,
  Building2, LogOut, X, Image as ImageIcon, CalendarRange,
  Users, CreditCard, Activity,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAppStore } from "@/store";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRole } from "@/hooks/use-role";
import { usePermissions } from "@/hooks/usePermissions";
import { NAV_ITEMS } from "@/types/rbac";
import type { UserRole } from "@/types";
import { OrgSwitcher, type OrgListItem } from "./org-switcher";

/* Maps NAV_ITEMS hrefs → lucide components so the existing icon rendering
 * is preserved while nav config lives centrally in src/types/rbac.ts. */
const ICON_MAP: Record<string, React.ElementType> = {
  "/dashboard":            LayoutDashboard,
  "/campaigns":            Layers,
  "/campaigns/calendar":   CalendarRange,
  "/ads":                  Megaphone,
  "/media":                ImageIcon,
  "/screens":              MonitorPlay,
  "/analytics":            BarChart3,
  "/approvals":            ClipboardCheck,
  "/clients":              Building2,
  "/settings/team":        Users,
  "/settings":             Settings,
  "/settings/billing":     CreditCard,
  "/settings/activity":    Activity,
};

function Avatar({ imageUrl, name, size = "sm" }: { imageUrl?: string; name: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-9 h-9 text-xs";
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn(dim, "rounded-full object-cover ring-1 ring-white/10 flex-shrink-0")}
      />
    );
  }
  return (
    <div className={cn(
      dim,
      "rounded-full bg-gradient-to-br from-[#B8EB23] to-[#8FBA10] flex items-center justify-center text-black font-bold flex-shrink-0"
    )}>
      {getInitials(name)}
    </div>
  );
}

function SidebarContent({ onClose, organizations, canCreateOrg }: { onClose?: () => void; organizations: OrgListItem[]; canCreateOrg: boolean }) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { user } = useUser();
  const { signOut } = useClerk();
  const isMobile = !!onClose;

  const displayName = user?.fullName ?? user?.firstName ?? "Usuario";
  const role = useRole() ?? "EXECUTIVE";
  const { user: permUser } = usePermissions();

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

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(permUser.role)
  );

  const collapsed = !isMobile && sidebarCollapsed;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#B8EB23] flex-shrink-0 glow-brand-sm">
          <Zap className="w-5 h-5 text-black" strokeWidth={2.5} />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden flex-1"
            >
              <div className="flex flex-col leading-none">
                <span className="text-[15px] font-bold tracking-tight text-white">
                  Bela<span className="text-[#B8EB23]">Blaze</span>
                </span>
                <span className="text-[10px] text-white/40 tracking-widest uppercase font-medium mt-0.5">
                  by BannerBlaze
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* Org switcher */}
      {!collapsed && organizations.length > 0 && (
        <div className="px-3 pt-3 pb-1">
          <OrgSwitcher organizations={organizations} canCreate={canCreateOrg} compact />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          const Icon = ICON_MAP[item.href] ?? Layers;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg transition-all duration-150 group cursor-pointer",
                active
                  ? "bg-[#B8EB23]/10 text-[#B8EB23]"
                  : "text-white/50 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-[#B8EB23]/10"
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
              <div className="relative flex-shrink-0">
                <Icon
                  className={cn("w-5 h-5 flex-shrink-0", active ? "text-[#B8EB23]" : "")}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {item.badge && !collapsed && !isMobile && (
                  <span className="absolute -top-1 -right-1.5 flex items-center justify-center w-3.5 h-3.5 text-[8px] font-bold rounded-full bg-[#B8EB23] text-black leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-between flex-1 min-w-0"
                  >
                    <span className="text-sm font-medium truncate">{item.label}</span>
                    {item.badge && (
                      <span className="flex-shrink-0 flex items-center justify-center w-[18px] h-[18px] text-[9px] font-bold rounded-full bg-[#B8EB23] text-black leading-none">
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1e1e1e] border border-white/10 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 inline-flex items-center justify-center w-3.5 h-3.5 text-[8px] font-bold rounded-full bg-[#B8EB23] text-black leading-none">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-3 space-y-1">
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg hover:bg-white/[0.04] transition-all group">
          <Avatar imageUrl={user?.imageUrl ?? undefined} name={displayName} />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-white truncate leading-none">{displayName}</p>
                <p className="text-[11px] text-white/40 mt-0.5 truncate">{roleLabel[role] ?? role}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={() => signOut({ redirectUrl: "/sign-in" })}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex-shrink-0 p-1 rounded-lg text-white/20 hover:text-red-400/80 hover:bg-red-400/[0.07] transition-all"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.8} />
            </button>
          )}
        </div>

        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronLeft className="w-5 h-5 flex-shrink-0" strokeWidth={1.8} />
            </motion.div>
            {!collapsed && (
              <span className="text-xs font-medium">Colapsar menú</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ organizations = [], canCreateOrg = false }: { organizations?: OrgListItem[]; canCreateOrg?: boolean }) {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col h-screen bg-[#0f0f0f] border-r border-white/[0.06] flex-shrink-0 overflow-hidden z-30"
      >
        <SidebarContent organizations={organizations} canCreateOrg={canCreateOrg} />
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0f0f0f] border-r border-white/[0.06] z-50 lg:hidden overflow-hidden"
            >
              <SidebarContent organizations={organizations} canCreateOrg={canCreateOrg} onClose={() => setMobileSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
