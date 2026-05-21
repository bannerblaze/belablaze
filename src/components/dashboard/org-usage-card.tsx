import { Layers, MonitorPlay, HardDrive, BarChart3 } from "lucide-react";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/* Server component: minimalist "what's in this account" snapshot.
 * All DB queries are wrapped so a single failure never breaks the card. */

function MetricRow({
  icon: Icon, label, value, suffix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="flex items-center gap-2.5 text-[13px] text-white/65 font-medium min-w-0">
        <Icon className="w-3.5 h-3.5 text-white/35 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-sm tabular-nums text-white font-semibold flex-shrink-0">
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix && <span className="text-white/40 font-normal text-[11px] ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

export async function OrgUsageCard() {
  const ctx = await getOrgContext().catch(() => null);
  if (!ctx) return null;

  let campaigns = 0;
  let screens = 0;
  let storageMB = 0;

  try {
    const [c, s, media] = await Promise.all([
      db.campaign.count({ where: { organizationId: ctx.organizationId } }),
      db.screen.count({ where: { organizationId: ctx.organizationId } }),
      db.mediaAsset.aggregate({
        where: { organizationId: ctx.organizationId, isArchived: false },
        _sum: { size: true },
      }),
    ]);
    campaigns = c;
    screens = s;
    storageMB = Math.round(((media._sum.size ?? 0) / 1024 / 1024) * 10) / 10;
  } catch {
    // DB unavailable — show zeros, don't crash
  }

  return (
    <Card>
      <CardHeader
        title={ctx.organizationName}
        subtitle="Uso actual de tu cuenta"
        icon={<BarChart3 className="w-4 h-4" />}
      />
      <CardContent className="pt-3 divide-y divide-white/[0.04]">
        <MetricRow icon={Layers}      label="Campañas"       value={campaigns} />
        <MetricRow icon={MonitorPlay} label="Pantallas"       value={screens} />
        <MetricRow icon={HardDrive}   label="Almacenamiento" value={storageMB} suffix="MB" />
      </CardContent>
    </Card>
  );
}
