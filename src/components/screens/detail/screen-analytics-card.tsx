import { Eye, Layers, Play, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ScreenDetailData } from "@/services/screen-details.service";

/* ──────────────────────────────────────────────────────────────────────
 * ScreenAnalyticsCard — metrics summary.
 *
 * Impressions aggregate from ads linked via AdSchedule.
 * Charts are prepared as visual placeholders — ready to be wired
 * to real time-series data via recharts.
 * ────────────────────────────────────────────────────────────────────── */

interface Props { data: ScreenDetailData }

interface MetricTileProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

function MetricTile({ icon: Icon, label, value, sub, highlight }: MetricTileProps) {
  return (
    <div className={cn(
      "flex flex-col gap-1 p-3 rounded-xl border",
      highlight
        ? "bg-[#B8EB23]/[0.04] border-[#B8EB23]/15"
        : "bg-white/[0.02] border-white/[0.05]",
    )}>
      <div className="flex items-center gap-1.5">
        <Icon className={cn("w-3 h-3", highlight ? "text-[#B8EB23]/60" : "text-white/30")} />
        <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/30">{label}</span>
      </div>
      <span className={cn("text-lg font-bold tabular-nums", highlight ? "text-[#B8EB23]" : "text-white")}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-white/30">{sub}</span>}
    </div>
  );
}

/* Sparkline placeholder — SVG that looks like a real chart */
function SparklinePlaceholder({ color = "#B8EB23" }: { color?: string }) {
  const points = [40, 25, 55, 30, 65, 45, 70, 50, 80, 60, 75, 85];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const h = 40;
  const w = 200;
  const step = w / (points.length - 1);

  const pathD = points
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / (max - min)) * h;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const areaD =
    pathD +
    ` L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 40 }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace("#", "")})`} />
      <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ScreenAnalyticsCard({ data }: Props) {
  const revenueEstimate = data.dailyTraffic * data.pricePerSecond * 0.01;

  return (
    <Card className="h-full">
      <CardHeader
        title="Analytics"
        subtitle="Métricas de rendimiento"
        icon={<TrendingUp className="w-4 h-4" />}
        action={
          <span className="text-[10px] font-mono text-white/25 px-2 py-0.5 rounded bg-white/[0.04]">
            ACUMULADO
          </span>
        }
      />
      <CardContent className="pt-4 space-y-3">
        {/* Metric grid */}
        <div className="grid grid-cols-2 gap-2">
          <MetricTile
            icon={Eye}
            label="Impresiones"
            value={formatNumber(data.metrics.impressionsTotal, true)}
            sub="Acumulado total"
            highlight={data.metrics.impressionsTotal > 0}
          />
          <MetricTile
            icon={Layers}
            label="Campañas"
            value={String(data.metrics.activeCampaigns)}
            sub="En curso"
          />
          <MetricTile
            icon={Play}
            label="Anuncios"
            value={String(data.metrics.activeAds)}
            sub="Activos"
          />
          <MetricTile
            icon={DollarSign}
            label="Potencial/día"
            value={formatCurrency(revenueEstimate)}
            sub="Estimado"
          />
        </div>

        {/* Mini chart — prepared for real data */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/30">
              Tendencia (7d)
            </span>
            <span className="text-[10px] text-white/20 font-mono">PLACEHOLDER</span>
          </div>
          <SparklinePlaceholder color="#B8EB23" />
        </div>

        {/* Daily traffic bar */}
        <div className="px-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">Tráfico diario</span>
            <span className="text-[10px] font-mono text-white/55">
              {formatNumber(data.dailyTraffic, true)} visitas
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#B8EB23]/60 to-[#B8EB23] rounded-full"
              style={{ width: `${Math.min(100, (data.dailyTraffic / 100_000) * 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
