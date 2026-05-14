"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { Check, X as XIcon, CreditCard, Zap, Sparkles, Crown, FileText, Clock, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { setPlan } from "@/actions/billing";
import { PLAN_TIERS, PLANS, type PlanFeature } from "@/lib/plans";
import type { PlanTier, PlanLimits } from "@/types";

interface Props {
  currentPlan: PlanTier;
  status: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  usage: { campaigns: number; screens: number; members: number; mediaAssets: number; storageMB: number };
  limits: Record<PlanTier, PlanLimits>;
  plans: Record<PlanTier, { name: string; tagline: string; priceMonthly: number; features: string[] }>;
  canManage: boolean;
}

const PLAN_ICON: Record<PlanTier, typeof Zap> = {
  FREE: Leaf,
  STARTER: Zap,
  GROWTH: Sparkles,
  ENTERPRISE: Crown,
};

/* Features displayed in the comparison matrix at the bottom of the page.
 * Labels match the user-facing language on the plan cards. */
const FEATURE_ROWS: Array<{ key: PlanFeature; label: string }> = [
  { key: "advancedAnalytics", label: "Analytics avanzado (cohorts, top campañas, breakdown ciudad)" },
  { key: "analyticsExport",   label: "Exportar reportes (CSV / PDF)" },
  { key: "auditLog",          label: "Audit log de la organización" },
  { key: "auditExport",       label: "Exportar audit log a CSV" },
  { key: "apiKeys",           label: "API keys para integraciones" },
  { key: "webhooks",          label: "Webhooks de eventos" },
  { key: "customBranding",    label: "Custom branding (logo + color de marca)" },
  { key: "ssoSaml",           label: "SSO / SAML" },
  { key: "multipleOrgs",      label: "Múltiples organizaciones" },
  { key: "multiWorkspace",    label: "Múltiples workspaces" },
  { key: "prioritySupport",   label: "Soporte prioritario" },
];

function Bar({ value, max, label, unit }: { value: number; max: number; label: string; unit?: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  const isWarn = pct >= 80;
  const isCrit = pct >= 95;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-white/60 font-medium">{label}</span>
        <span className={cn(
          "text-xs tabular-nums font-semibold",
          isCrit ? "text-red-300" : isWarn ? "text-amber-300" : "text-white",
        )}>
          {value.toLocaleString()}{unit ?? ""} <span className="text-white/30">/ {max.toLocaleString()}{unit ?? ""}</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            isCrit ? "bg-red-400" : isWarn ? "bg-amber-400" : "bg-[#B8EB23]",
          )}
        />
      </div>
    </div>
  );
}

export function BillingClient({ currentPlan, status, currentPeriodEnd, trialEndsAt, usage, limits, plans, canManage }: Props) {
  const [pending, startTransition] = useTransition();
  const planLimits = limits[currentPlan];

  const handleSelect = (plan: PlanTier) => {
    if (plan === currentPlan) return;
    if (!canManage) { toast.error("Solo el propietario o admin puede cambiar el plan."); return; }
    startTransition(async () => {
      const res = await setPlan(plan);
      if (res.ok) toast.success(`Plan cambiado a ${plans[plan].name}`);
      else toast.error(res.error);
    });
  };

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#B8EB23]/10 border border-[#B8EB23]/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-[#B8EB23]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Plan {plans[currentPlan].name}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {status === "TRIALING" && trialEndsAt ? (
                    <>Trial activo — termina el {new Date(trialEndsAt).toLocaleDateString("es-CO")}</>
                  ) : (
                    <>Próxima renovación: {new Date(currentPeriodEnd).toLocaleDateString("es-CO")}</>
                  )}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#B8EB23]/10 text-[#B8EB23] border border-[#B8EB23]/20">
              {status}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader title="Uso actual" subtitle="Consumo del periodo de facturación" icon={<Clock className="w-4 h-4" />} />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Bar value={usage.campaigns} max={planLimits.campaigns} label="Campañas" />
            <Bar value={usage.screens} max={planLimits.screens} label="Pantallas" />
            <Bar value={usage.members} max={planLimits.members} label="Miembros" />
            <Bar value={usage.mediaAssets} max={planLimits.mediaAssets} label="Archivos media" />
            <Bar value={Math.round(usage.storageMB)} max={planLimits.storageMB} label="Almacenamiento" unit=" MB" />
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Planes disponibles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {PLAN_TIERS.map((p) => {
            const detail = plans[p];
            const Icon = PLAN_ICON[p];
            const active = p === currentPlan;
            const recommended = PLANS[p].popular === true;
            return (
              <motion.div
                key={p}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "relative rounded-2xl border p-5 flex flex-col",
                  active
                    ? "bg-gradient-to-br from-[#B8EB23]/10 to-transparent border-[#B8EB23]/40"
                    : "bg-white/[0.02] border-white/[0.06]",
                )}
              >
                {recommended && !active && (
                  <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[#B8EB23] text-black">
                    Popular
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    active ? "bg-[#B8EB23]/15 text-[#B8EB23]" : "bg-white/[0.04] text-white/40",
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">{detail.name}</h4>
                  {active && (
                    <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#B8EB23]/15 text-[#B8EB23]">
                      Actual
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/40 mb-4">{detail.tagline}</p>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-white">
                    {detail.priceMonthly === 0 ? "Gratis" : `$${detail.priceMonthly}`}
                  </span>
                  {detail.priceMonthly > 0 && (
                    <span className="text-xs text-white/40 ml-1">/mes</span>
                  )}
                </div>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {detail.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-white/60">
                      <Check className="w-3.5 h-3.5 text-[#B8EB23] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={active ? "outline" : "primary"}
                  disabled={pending || active || !canManage}
                  onClick={() => handleSelect(p)}
                  className="w-full"
                >
                  {active ? "Plan actual" : detail.priceMonthly === 0 ? "Continuar gratis" : "Cambiar a este plan"}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Feature comparison matrix */}
      <Card>
        <CardHeader
          title="Comparación de funciones"
          subtitle="Qué incluye cada plan a nivel de capacidades"
        />
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2.5 pr-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                  Función
                </th>
                {PLAN_TIERS.map((p) => (
                  <th
                    key={p}
                    className={cn(
                      "py-2.5 px-2 text-center text-[10px] font-semibold uppercase tracking-wider",
                      p === currentPlan ? "text-[#B8EB23]" : "text-white/40",
                    )}
                  >
                    {plans[p].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row) => (
                <tr key={row.key} className="border-b border-white/[0.04] last:border-0">
                  <td className="py-2.5 pr-3 text-xs text-white/70">{row.label}</td>
                  {PLAN_TIERS.map((p) => {
                    const enabled = PLANS[p].features[row.key];
                    return (
                      <td
                        key={p}
                        className={cn(
                          "py-2.5 px-2 text-center",
                          p === currentPlan && "bg-[#B8EB23]/[0.03]",
                        )}
                      >
                        {enabled ? (
                          <Check className="w-3.5 h-3.5 text-[#B8EB23] inline" strokeWidth={2.5} />
                        ) : (
                          <XIcon className="w-3.5 h-3.5 text-white/20 inline" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Numeric limits row */}
              {(["campaigns", "screens", "members", "storageMB", "mediaAssets"] as const).map((key) => (
                <tr key={key} className="border-b border-white/[0.04] last:border-0">
                  <td className="py-2.5 pr-3 text-xs text-white/70 capitalize">
                    {{
                      campaigns: "Campañas",
                      screens: "Pantallas",
                      members: "Miembros (incl. invitaciones)",
                      storageMB: "Almacenamiento",
                      mediaAssets: "Archivos media",
                    }[key]}
                  </td>
                  {PLAN_TIERS.map((p) => {
                    const v = PLANS[p].limits[key];
                    const display = v >= 9999 ? "∞" : key === "storageMB"
                      ? v >= 1000 ? `${(v / 1000).toFixed(0)} GB` : `${v} MB`
                      : v.toLocaleString();
                    return (
                      <td
                        key={p}
                        className={cn(
                          "py-2.5 px-2 text-center text-xs tabular-nums text-white/70 font-medium",
                          p === currentPlan && "bg-[#B8EB23]/[0.03] text-white",
                        )}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Invoices placeholder */}
      <Card>
        <CardHeader title="Historial de facturas" subtitle="Estará disponible cuando integremos Stripe" icon={<FileText className="w-4 h-4" />} />
        <CardContent className="py-10 text-center">
          <p className="text-xs text-white/30">Aún no hay facturas. La integración con Stripe llegará pronto.</p>
        </CardContent>
      </Card>
    </div>
  );
}
