"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User, Users, CreditCard, Activity, Shield, Code2, Webhook,
  Palette, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* Tabbed nav for /settings/* — pure client component, drives navigation
 * via <Link>. The "Danger" group is rendered separately at the bottom. */

const PRIMARY = [
  { href: "/settings", label: "Perfil", icon: User, exact: true },
  { href: "/settings/team", label: "Equipo", icon: Users },
  { href: "/settings/billing", label: "Facturación", icon: CreditCard },
  { href: "/settings/activity", label: "Actividad", icon: Activity },
  { href: "/settings/security", label: "Seguridad", icon: Shield },
  { href: "/settings/branding", label: "Branding", icon: Palette },
  { href: "/settings/api-keys", label: "API Keys", icon: Code2 },
  { href: "/settings/webhooks", label: "Webhooks", icon: Webhook },
];

const DANGER = [
  { href: "/settings/danger", label: "Zona peligrosa", icon: AlertTriangle },
];

export function SettingsNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      <nav className="space-y-0.5">
        {PRIMARY.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-[#B8EB23]/10 text-[#B8EB23]"
                  : "text-white/50 hover:text-white hover:bg-white/[0.04]",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.4 : 1.8} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 pt-4 border-t border-white/[0.05] space-y-0.5">
        {DANGER.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-red-400/10 text-red-300"
                  : "text-white/40 hover:text-red-300 hover:bg-red-400/[0.04]",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

export function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-white">Configuración</h1>
        <p className="text-xs text-white/40 mt-0.5">Gestiona tu organización, equipo, facturación y más</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <SettingsNav />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
