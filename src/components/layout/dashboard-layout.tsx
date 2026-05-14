"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { Toaster } from "sonner";
import { useAppStore } from "@/store";
import { CommandPalette } from "@/components/command-palette";
import type { OrgListItem } from "./org-switcher";
import type { AccountType } from "@/types";
import type { PlatformRole } from "@/lib/platform";

interface DashboardLayoutProps {
  children: React.ReactNode;
  organizations?: OrgListItem[];
  canCreateOrg?: boolean;
  accountType?: AccountType | null;
  platformRole?: PlatformRole;
}

export function DashboardLayout({
  children,
  organizations = [],
  canCreateOrg = false,
  accountType = null,
  platformRole = "USER",
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const { setMobileSidebarOpen } = useAppStore();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      <Sidebar
        organizations={organizations}
        canCreateOrg={canCreateOrg}
        accountType={accountType}
        platformRole={platformRole}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
      <CommandPalette organizations={organizations} />
      <Toaster
        position="bottom-right"
        theme="dark"
        gap={10}
        offset={20}
        toastOptions={{
          duration: 4000,
          className: "font-sans",
          style: {
            background: "rgba(20,20,20,0.95)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "13px",
            padding: "12px 14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          },
        }}
      />
    </div>
  );
}
