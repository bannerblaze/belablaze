"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User, Users, CreditCard, Activity, Shield, Code2, Webhook,
  Palette, AlertTriangle, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanFeature } from "@/lib/plans";

/* Tabbed nav for /settings/*. Pure client component, driven by the
 * parent server shell which decides which feature-gated items are
 * available for the current org's plan. */

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
  /** When set, the item is only rendered when the org's plan has it. */
  requires?: PlanFeature;
};

const PRIMARY: NavItem[] = [
  { href: "/settings",          label: "Perfil",       icon: User, exact: true },
  { href: "/settings/team",     label: "Equipo",       icon: Users },
  { href: "/settings/billing",  label: "Facturación",  icon: CreditCard },
  { href: "/settings/activity", label: "Actividad",    icon: Activity,  requires: "auditLog" },
  { href: "/settings/security", label: "Seguridad",    icon: Shield },
  { href: "/settings/branding", label: "Branding",     icon: Palette,   requires: "customBranding" },
  { href: "/settings/api-keys", label: "API Keys",     icon: Code2,     requires: "apiKeys" },
  { href: "/settings/webhooks", label: "Webhooks",     icon: Webhook,   requires: "webhooks" },
];

const DANGER: NavItem[] = [
  { href: "/settings/danger", label: "Zona peligrosa", icon: AlertTriangle },
];

interface SettingsNavProps {
  /** Feature flags the org's current plan unlocks. Items with a
   *  `requires` that's NOT in this set are rendered as locked. */
  availableFeatures: PlanFeature[];
}

export function SettingsNav({ availableFeatures }: SettingsNavProps) {
  const pathname = usePathname();
  const available = new Set(availableFeatures);
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      <nav className="space-y-0.5">
        {PRIMARY.map((item) => {
          const active = isActive(item.href, item.exact);
          const locked = item.requires ? !available.has(item.requires) : false;
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
