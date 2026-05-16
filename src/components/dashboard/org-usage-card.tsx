import Link from "next/link";
import { Layers, MonitorPlay, HardDrive, ArrowRight, BarChart3 } from "lucide-react";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/* Server component: simple "what's in this org" snapshot. No plan, no
 * limits, no max bars — the product no longer has tier caps so the
 * widget just shows the live counts of the four resources we track. */

function MetricRow({
  icon: Icon, label, value, suffix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="flex items-center gap-2 text-[11px] text-white/60 font-medium">
        <Icon className="w-3 h-3 text-white/40" />
        {label}
      </span>
      <span className="text-xs tabular-nums text-white font-semibold">
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix && <span className="text-white/40 font-normal text-[10px] ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

export async function OrgUsageCard() {
  const ctx = await getOrgContext();
  if (!ctx) return null;

  const [campaigns, screens, media] = await Promise.all([
    db.campaign.count({ where: { organizationId: ctx.organizationId } }),
    db.screen.count({ where: { organizationId: ctx.organizationId } }),
    db.mediaAsset.aggregate({
      where: { organizationId: ctx.organizationId, isArchived: false },
      _sum: { size: true },
    }),
  ]);

  const storageMB = Math.round(((media._sum.size ?? 0) / 1024 / 1024) * 10) / 10;

  return (
    <Card>
      <CardHeader
        title={ctx.organizationName}
        subtitle="Resumen de uso de la organización"
        icon={<BarChart3 className="w-4 h-4" />}
        action={
          <Link
            href="/settings/billing"
            prefetch
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#B8EB23] bg-[#B8EB23]/[0.06] border border-[#B8EB23]/15 hover:bg-[#B8EB23]/[0.12] hover:border-[#B8EB23]/30 transition-all"
          >
            Ver suscripción
            <ArrowRight className="w-3 h-3" />
          </Link>
        }
      />
      <CardContent className="pt-2 divide-y divide-white/[0.04]">
        <MetricRow icon={Layers}      label="Campañas"          value={campaigns} />
        <MetricRow icon={MonitorPlay} label="Pantallas"          value={screens} />
        <MetricRow icon={HardDrive}   label="Almacenamiento"     value={storageMB} suffix="MB" />
      </CardContent>
    </Card>
  );
}
