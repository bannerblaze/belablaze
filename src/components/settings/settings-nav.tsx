"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User, Activity, Shield, Code2, Webhook,
  Palette, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/types";

/* Tabbed nav for /settings/*. The parent server shell decides
 * accountType + isPlatformAdmin and feeds them in; this client
 * component just filters and renders. No plan-feature gating —
 * visibility is purely accountType-based now. */

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
  /** Item only renders for these accountTypes. Creators (PERSON)
   *  never need API Keys / Webhooks / Branding / Audit.
   *  SUPER_ADMIN bypasses this filter. */
  forAccountTypes?: AccountType[];
};

const PRIMARY: NavItem[] = [
  { href: "/settings",          label: "Perfil",       icon: User, exact: true },
  { href: "/settings/activity", label: "Actividad",    icon: Activity,
    forAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  { href: "/settings/security", label: "Seguridad",    icon: Shield },
  { href: "/settings/branding", label: "Branding",     icon: Palette,
    forAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  { href: "/settings/api-keys", label: "API Keys",     icon: Code2,
    forAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  { href: "/settings/webhooks", label: "Webhooks",     icon: Webhook,
    forAccountTypes: ["ORGANIZATION", "INTERNAL"] },
];

const DANGER: NavItem[] = [
  { href: "/settings/danger", label: "Zona peligrosa", icon: AlertTriangle },
];

interface SettingsNavProps {
  /** The user's account type — items declare forAccountTypes and are
   *  filtered out when the user doesn't match. */
  accountType: AccountType | null;
  /** Platform super-admin (admin@bannerblaze.com etc.) — sees every
   *  entry regardless of accountType. */
  isPlatformAdmin: boolean;
}

export function SettingsNav({ accountType, isPlatformAdmin }: SettingsNavProps) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const visibleItems = PRIMARY.filter((item) => {
    if (isPlatformAdmin) return true;
    if (item.forAccountTypes && accountType
        && !item.forAccountTypes.includes(accountType)) {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      <nav className="space-y-0.5">
        {visibleItems.map((item) => {
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
