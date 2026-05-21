import {
  Users, Layers, Play, Monitor, Ruler, DollarSign,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatNumber, formatRelativeTime, getScreenTypeLabel } from "@/lib/utils";
import type { ScreenDetailData } from "@/services/screen-details.service";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────
 * ScreenOverviewCard — operational summary.
 *
 * Shows the 6 most important operational facts about the screen
 * in a dense metric grid. Color-coded by status.
 * ────────────────────────────────────────────────────────────────────── */

interface Props { data: ScreenDetailData }

function StatCell({
  icon: Icon,
  label,
  value,
  subvalue,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  subvalue?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      "flex flex-col gap-1.5 p-3.5 rounded-xl border transition-colors",
      accent
        ? "bg-[#B8EB23]/[0.04] border-[#B8EB23]/15"
        : "bg-white/[0.02] border-white/[0.05]",
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn("w-3.5 h-3.5", accent ? "text-[#B8EB23]/70" : "text-white/35")} />
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35">{label}</span>
      </div>
      <div className={cn("text-sm font-bold leading-tight", accent ? "text-[#B8EB23]" : "text-white")}>
        {value}
      </div>
      {subvalue && <div className="text-[10px] text-white/35 leading-none">{subvalue}</div>}
    </div>
  );
}

export function ScreenOverviewCard({ data }: Props) {
  const isOnline = data.status === "ONLINE";

  return (
    <Card className="h-full">
      <CardHeader
        title="Resumen operacional"
        subtitle="Estado actual del dispositivo"
        icon={<Monitor className="w-4 h-4" />}
      />
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <StatCell
            icon={Play}
            label="Campañas"
            value={`${data.metrics.activeCampaigns} activas`}
            subvalue={`${data.campaigns.length} asignadas`}
            accent={data.metrics.activeCampaigns > 0}
          />
          <StatCell
            icon={Layers}
            label="Anuncios"
            value={`${data.metrics.activeAds} activos`}
            subvalue={`${data.metrics.totalAds} total`}
          />
          <StatCell
            icon={Users}
            label="Tráfico"
            value={formatNumber(data.dailyTraffic, true)}
            subvalue="visitas/día"
          />
          <StatCell
            icon={Monitor}
            label="Tipo"
            value={getScreenTypeLabel(data.type)}
            subvalue={data.orientation === "landscape" ? "Horizontal" : "Vertical"}
          />
          <StatCell
            icon={Ruler}
            label="Dimensión"
            value={`${data.width}×${data.height}m`}
            subvalue={`${data.resolutionWidth}×${data.resolutionHeight}px`}
          />
          <StatCell
            icon={DollarSign}
            label="Tarifa"
            value={`$${formatNumber(data.pricePerSecond)}`}
            subvalue="por segundo"
          />
        </div>

        {/* Last seen */}
        {data.lastSeenAt && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full flex-shrink-0",
              isOnline ? "bg-[#B8EB23] animate-pulse" : "bg-white/25",
            )} />
            <span className="text-[11px] text-white/40">
              {isOnline ? "Conectado ahora" : `Último contacto ${formatRelativeTime(data.lastSeenAt)}`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
