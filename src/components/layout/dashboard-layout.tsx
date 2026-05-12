"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Toaster } from "sonner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            borderRadius: "12px",
          },
        }}
      />
    </div>
  );
}
