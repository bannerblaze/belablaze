import {
  Monitor, Plus, RefreshCw, Layers, AlertCircle,
  CheckCircle, XCircle, Settings, Clock,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ScreenDetailData } from "@/services/screen-details.service";

/* ──────────────────────────────────────────────────────────────────────
 * ScreenActivityFeed — audit log timeline for this screen.
 *
 * Maps AuditLog actions to icons + colors + Spanish descriptions.
 * ────────────────────────────────────────────────────────────────────── */

interface Props { data: ScreenDetailData }

interface EventConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  label: (metadata: Record<string, unknown> | null, action?: string) => string;
}

const EVENT_MAP: Record<string, EventConfig> = {
  "screen.create": {
    icon: Monitor,
    color: "text-[#B8EB23]",
    bgColor: "bg-[#B8EB23]/10",
    label: () => "Pantalla registrada",
  },
  "screen.update": {
    icon: Settings,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    label: () => "Configuración actualizada",
  },
  "screen.delete": {
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    label: () => "Pantalla eliminada",
  },
  "screen.campaigns.assign": {
    icon: Layers,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    label: (m) =>
      m?.campaignCount != null
        ? `${m.campaignCount} campaña${Number(m.campaignCount) !== 1 ? "s" : ""} asignada${Number(m.campaignCount) !== 1 ? "s" : ""}`
        : "Campañas asignadas",
  },
  "screen.campaigns.remove": {
    icon: Layers,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    label: () => "Campaña desasignada",
  },
  "screen.update.status": {
    icon: RefreshCw,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    label: (m) => m?.to ? `Estado: ${String(m.to)}` : "Estado actualizado",
  },
};

const DEFAULT_EVENT: EventConfig = {
  icon: Clock,
  color: "text-white/40",
  bgColor: "bg-white/[0.05]",
  label: (_metadata, action) => action ?? "Evento",
};

function getEventConfig(action: string): EventConfig {
  for (const [key, config] of Object.entries(EVENT_MAP)) {
    if (action.includes(key.replace("screen.", "").replace(".", "."))) return config;
    if (action === key) return config;
  }
  return DEFAULT_EVENT;
}

function TimelineEntry({
  action,
  metadata,
  createdAt,
  user,
  isLast,
}: {
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { name: string } | null;
  isLast: boolean;
}) {
  const config = EVENT_MAP[action] ?? DEFAULT_EVENT;
  const label = config.label(metadata);
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      {/* Timeline track */}
      <div className="flex flex-col items-center gap-0">
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
          config.bgColor,
        )}>
          <Icon className={cn("w-3 h-3", config.color)} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-white/[0.06] mt-1 min-h-[16px]" />
        )}
      </div>

      {/* Content */}
      <div className={cn("pb-4 min-w-0 flex-1", isLast && "pb-0")}>
        <p className="text-[12px] font-semibold text-white/80 leading-snug">{label}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {user && (
            <>
              <span className="text-[10px] text-white/35">{user.name}</span>
              <span className="text-white/15 text-[10px]">·</span>
            </>
          )}
          <span className="text-[10px] text-white/30">{formatRelativeTime(createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

export function ScreenActivityFeed({ data }: Props) {
  /* Build synthetic events from screen data for initial state (no audit events yet) */
  const syntheticActivity = data.activity.length === 0 ? [{
    id: "created",
    action: "screen.create",
    metadata: null,
    createdAt: data.createdAt,
    user: null,
  }] : data.activity;

  return (
    <Card className="h-full">
      <CardHeader
        title="Actividad reciente"
        subtitle="Historial de eventos"
        icon={<Clock className="w-4 h-4" />}
        action={
          <span className="text-[10px] font-mono text-white/25">
            {syntheticActivity.length} eventos
          </span>
        }
      />
      <CardContent className="pt-4">
        {syntheticActivity.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <Clock className="w-7 h-7 text-white/15" />
            <p className="text-[11px] text-white/30">Sin actividad registrada</p>
          </div>
        ) : (
          <div>
            {syntheticActivity.map((entry, i) => (
              <TimelineEntry
                key={entry.id}
                action={entry.action}
                metadata={entry.metadata}
                createdAt={entry.createdAt}
                user={entry.user}
                isLast={i === syntheticActivity.length - 1}
              />
            ))}
          </div>
        )}

        {/* Screen creation footer */}
        <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-[#B8EB23]/40" />
          <span className="text-[10px] text-white/30">
            Registrada {formatRelativeTime(data.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
