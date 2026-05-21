import { Wifi, WifiOff, AlertTriangle, Signal, RefreshCw, Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ScreenDetailData } from "@/services/screen-details.service";

/* ──────────────────────────────────────────────────────────────────────
 * ScreenHealthCard — connectivity and system health indicators.
 * ────────────────────────────────────────────────────────────────────── */

interface Props { data: ScreenDetailData }

function healthFromLastSeen(lastSeenAt: string | null): {
  level: "good" | "warn" | "bad";
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
} {
  if (!lastSeenAt) return {
    level: "bad", label: "Sin datos",
    color: "text-red-400", bgColor: "bg-red-400/10", dotColor: "bg-red-400",
  };

  const minutesAgo = (Date.now() - new Date(lastSeenAt).getTime()) / 60_000;

  if (minutesAgo < 2) return {
    level: "good", label: "Conectado",
    color: "text-[#B8EB23]", bgColor: "bg-[#B8EB23]/10", dotColor: "bg-[#B8EB23]",
  };
  if (minutesAgo < 10) return {
    level: "warn", label: "Advertencia",
    color: "text-yellow-400", bgColor: "bg-yellow-400/10", dotColor: "bg-yellow-400",
  };
  return {
    level: "bad", label: "Sin señal",
    color: "text-red-400", bgColor: "bg-red-400/10", dotColor: "bg-red-400",
  };
}

interface HealthRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  status?: "good" | "warn" | "bad" | "neutral";
}

function HealthRow({ icon, label, value, status = "neutral" }: HealthRowProps) {
  const statusColors = {
    good: "text-[#B8EB23]",
    warn: "text-yellow-400",
    bad: "text-red-400",
    neutral: "text-white/70",
  };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-b-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-6 h-6 rounded-lg bg-white/[0.03] flex items-center justify-center text-white/35 flex-shrink-0">
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-white/40">
          {label}
        </span>
      </div>
      <span className={cn("text-xs font-semibold tabular-nums", statusColors[status])}>
        {value}
      </span>
    </div>
  );
}

export function ScreenHealthCard({ data }: Props) {
  const health = healthFromLastSeen(data.lastSeenAt);
  const isOnline = data.status === "ONLINE";

  const warnings: string[] = [];
  if (!isOnline) warnings.push("Pantalla sin conexión");
  if (!data.lastSeenAt) warnings.push("Heartbeat nunca recibido");
  if (data.metrics.activeCampaigns === 0) warnings.push("Sin campañas activas");

  return (
    <Card className="h-full">
      <CardHeader
        title="Estado del sistema"
        subtitle="Conectividad y salud"
        icon={isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
      />
      <CardContent className="pt-4 space-y-3">
        {/* Big status indicator */}
        <div className={cn(
          "flex items-center gap-3 p-3.5 rounded-xl border",
          health.bgColor, "border-current/10",
        )}>
          <div className="relative flex-shrink-0">
            {health.level === "good" && (
              <span className="absolute inset-0 rounded-full bg-[#B8EB23] opacity-40 animate-ping" />
            )}
            <span className={cn("relative w-3 h-3 rounded-full flex-shrink-0", health.dotColor)} />
          </div>
          <div>
            <p className={cn("text-sm font-bold", health.color)}>{health.label}</p>
            <p className="text-[10px] text-white/35 mt-0.5">
              {data.lastSeenAt
                ? `Último contacto ${formatRelativeTime(data.lastSeenAt)}`
                : "Nunca visto"}
            </p>
          </div>
          <div className="ml-auto">
            <Signal className={cn("w-5 h-5", health.color)} />
          </div>
        </div>

        {/* Health metrics */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3">
          <HealthRow
            icon={<RefreshCw className="w-3 h-3" />}
            label="Heartbeat"
            value={data.lastPingAt ? formatRelativeTime(data.lastPingAt) : "—"}
            status={isOnline ? "good" : "bad"}
          />
          <HealthRow
            icon={<Clock className="w-3 h-3" />}
            label="Última actividad"
            value={data.lastSeenAt ? formatRelativeTime(data.lastSeenAt) : "—"}
            status={health.level}
          />
          <HealthRow
            icon={<Wifi className="w-3 h-3" />}
            label="Player"
            value={isOnline ? "Activo" : data.status === "MAINTENANCE" ? "Mantenimiento" : "Offline"}
            status={isOnline ? "good" : "bad"}
          />
          <HealthRow
            icon={<Signal className="w-3 h-3" />}
            label="Conexión"
            value={data.status}
            status={isOnline ? "good" : data.status === "MAINTENANCE" ? "warn" : "bad"}
          />
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1.5">
            {warnings.map((w) => (
              <div
                key={w}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-yellow-400/[0.06] border border-yellow-400/15"
              >
                <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                <span className="text-[11px] text-yellow-400/80">{w}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
