"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User, Users, CreditCard, Activity, Shield, Code2, Webhook,
  Palette, AlertTriangle, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanFeature } from "@/lib/plans";
import type { AccountType } from "@/types";

/* Tabbed nav for /settings/*. Pure client component, driven by the
 * parent server shell which knows the org's plan + the caller's
 * accountType + whether they're a platform admin. */

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
  /** Item only renders when the org's plan unlocks this feature. */
  requires?: PlanFeature;
  /** Item only renders for these accountTypes. Creators (PERSON)
   *  never need Equipo / API Keys / Webhooks / Branding regardless
   *  of plan. SUPER_ADMIN bypasses this filter. */
  forAccountTypes?: AccountType[];
};

const PRIMARY: NavItem[] = [
  { href: "/settings",          label: "Perfil",       icon: User, exact: true },
  { href: "/settings/team",     label: "Equipo",       icon: Users,
    forAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  { href: "/settings/billing",  label: "Facturación",  icon: CreditCard },
  { href: "/settings/activity", label: "Actividad",    icon: Activity,
    requires: "auditLog",
    forAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  { href: "/settings/security", label: "Seguridad",    icon: Shield },
  { href: "/settings/branding", label: "Branding",     icon: Palette,
    requires: "customBranding",
    forAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  { href: "/settings/api-keys", label: "API Keys",     icon: Code2,
    requires: "apiKeys",
    forAccountTypes: ["ORGANIZATION", "INTERNAL"] },
  { href: "/settings/webhooks", label: "Webhooks",     icon: Webhook,
    requires: "webhooks",
    forAccountTypes: ["ORGANIZATION", "INTERNAL"] },
];

const DANGER: NavItem[] = [
  { href: "/settings/danger", label: "Zona peligrosa", icon: AlertTriangle },
];

interface SettingsNavProps {
  /** Feature flags the org's current plan unlocks. Items with a
   *  `requires` that's NOT in this set are rendered as locked. */
  availableFeatures: PlanFeature[];
  /** The user's account type (creator vs business vs internal). When
   *  an item declares forAccountTypes, the user must match — or be a
   *  platform admin. */
  accountType: AccountType | null;
  /** Platform super-admin (admin@bannerblaze.com etc.) — sees every
   *  entry regardless of plan or accountType. */
  isPlatformAdmin: boolean;
}

export function SettingsNav({ availableFeatures, accountType, isPlatformAdmin }: SettingsNavProps) {
  const pathname = usePathname();
  const available = new Set(availableFeatures);
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
          const locked = item.requires && !isPlatformAdmin
            ? !available.has(item.requires)
            : false;
          const Icon = item.icon;

          if (locked) {
            // Render the item as a locked teaser that links to /settings/billing
            // so users can see what's behind the gate without breaking nav.
            return (
              <Link
                key={item.href}
                href="/settings/billing"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all"
                title="Actualiza tu plan para desbloquear"
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.6} />
                <span className="truncate flex-1">{item.label}</span>
                <Lock className="w-3 h-3 flex-shrink-0 text-white/30" />
              </Link>
            );
          }

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
