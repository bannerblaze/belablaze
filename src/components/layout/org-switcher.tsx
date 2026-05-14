"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Check, ChevronDown, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { switchOrganization } from "@/actions/organizations";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

/* Organization switcher: shows the active org, lists other orgs the
 * user is a member of, and (when `canCreate`) exposes a CTA to create
 * a new org. The "create" entry routes to /organizations/new — a real
 * BelaBlaze wizard, NOT a redirect to the user profile.
 *
 * `canCreate` is false for CREATOR + INTERNAL accountType — those
 * users keep their single org and shouldn't see the option. */

export type OrgListItem = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  plan: string;
  role: string;
  isActive: boolean;
};

interface OrgSwitcherProps {
  organizations: OrgListItem[];
  compact?: boolean;
  canCreate?: boolean;
}

const PLAN_COLOR: Record<string, string> = {
  STARTER: "text-white/40",
  GROWTH: "text-[#B8EB23]",
  ENTERPRISE: "text-violet-300",
};

export function OrgSwitcher({ organizations, compact = false, canCreate = false }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const active = organizations.find((o) => o.isActive) ?? organizations[0];

  // Fallback: user has no orgs yet. Only ORGANIZATION-type accounts can
  // bootstrap a new one; everyone else should already have an org via
  // their onboarding flow and shouldn't see a dangling CTA here.
  if (!active) {
    if (!canCreate) return null;
    return (
      <button
        onClick={() => router.push("/organizations/new")}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-dashed border-[#B8EB23]/40 text-[#B8EB23] text-xs font-semibold hover:bg-[#B8EB23]/[0.06] transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Crear organización
      </button>
    );
  }

  const handleSwitch = (id: string) => {
    if (id === active.id) { setOpen(false); return; }
    startTransition(async () => {
      const res = await switchOrganization(id);
      if (res.ok) {
        toast.success("Organización cambiada");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className={cn(
          "flex items-center gap-2.5 rounded-xl border transition-all w-full",
          compact ? "px-2.5 py-1.5" : "px-3 py-2",
          open
            ? "bg-white/[0.06] border-white/[0.12]"
            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]",
        )}
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#B8EB23] to-[#8FBA10] flex items-center justify-center text-black font-bold text-[11px] flex-shrink-0">
          {active.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={active.logoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Building2 className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-white truncate leading-none">{active.name}</p>
          <p className={cn("text-[10px] font-medium uppercase tracking-wider mt-0.5", PLAN_COLOR[active.plan] ?? "text-white/40")}>
            {active.plan}
          </p>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-white/40 flex-shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 mt-2 z-50 rounded-xl bg-[#1a1a1a] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
            >
              <div className="p-1.5 max-h-[340px] overflow-y-auto">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSwitch(org.id)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#B8EB23] to-[#8FBA10] flex items-center justify-center text-black font-bold text-[11px] flex-shrink-0">
                      {org.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={org.logoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-semibold text-white truncate leading-none">{org.name}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{org.role}</p>
                    </div>
                    {org.id === active.id && <Check className="w-3.5 h-3.5 text-[#B8EB23] flex-shrink-0" />}
                  </button>
                ))}
              </div>
              {canCreate && (
                <div className="border-t border-white/[0.06] p-1.5">
                  <button
                    onClick={() => { router.push("/organizations/new"); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-[#B8EB23] hover:bg-[#B8EB23]/[0.06] transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Crear nueva organización
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
