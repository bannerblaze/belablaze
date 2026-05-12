"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Layers, Megaphone, BarChart3, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/campaigns", icon: Layers, label: "Campañas" },
  { href: "/ads", icon: Megaphone, label: "Anuncios" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/approvals", icon: ClipboardCheck, label: "Aprobaciones", badge: 2 },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0f0f0f]/95 backdrop-blur-xl border-t border-white/[0.06]">
      <div className="flex items-center justify-around px-2 py-1 pb-safe">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[56px]",
                active ? "text-[#B8EB23]" : "text-white/35 hover:text-white/60"
              )}
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 rounded-xl bg-[#B8EB23]/10"
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
              <div className="relative">
                <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-3.5 h-3.5 text-[8px] font-bold rounded-full bg-[#B8EB23] text-black leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[9px] font-medium leading-none", active ? "text-[#B8EB23]" : "text-white/30")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
