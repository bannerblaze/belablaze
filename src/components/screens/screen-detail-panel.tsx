"use client";

import { useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Maximize2, Monitor, Users, Activity,
  RefreshCw, Pencil, MoreHorizontal, Signal, Building2,
  Calendar, AlertCircle, Ruler, Cpu, Layers, Trash2,
} from "lucide-react";
import { ScreenStatusBadge } from "./screen-status-badge";
import { AssignCampaignsModal } from "./assign-campaigns-modal";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { pingScreen } from "@/actions/screens";
import { removeCampaignFromScreen } from "@/actions/screen-campaigns";
import { cn, formatNumber, formatRelativeTime, getScreenTypeLabel } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import type { ScreenStatus } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Slide-out detail panel for a single screen.
 *
 * Mirrors the IoT/fleet pattern: device identity + telemetry + actions
 * stacked in a right-anchored drawer. Renders a backdrop on mobile only
 * so desktop users keep the underlying map context visible.
 *
 * Actions are gated by `canManage` — non-managers see the data but the
 * mutate buttons disappear (defense-in-depth: server still re-checks).
 * ────────────────────────────────────────────────────────────────────── */

export type AssignedCampaignItem = {
  id: string;
  campaignId: string;
  priority: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  campaign: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    client: { name: string } | null;
  };
};

export interface DetailScreen {
  id: string;
  name: string;
  code: string;
  type: string;
  status: ScreenStatus;
  city: string;
  address: string;
  width: number;
  height: number;
  resolutionWidth: number;
  resolutionHeight: number;
  dailyTraffic: number;
  pricePerSecond: number;
  orientation: string;
  playerKey?: string;
  lastPingAt?: string | null;
  createdAt?: string | null;
  screenCampaigns?: AssignedCampaignItem[];
}

interface Props {
  screen: DetailScreen | null;
  open: boolean;
  onClose: () => void;
  canManage?: boolean;
  onEdit?: (screen: DetailScreen) => void;
}

function MetricRow({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-b-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/40 flex-shrink-0">
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-white/45">
          {label}
        </span>
      </div>
      <span className={cn("text-xs font-semibold tabular-nums text-right", accent ?? "text-white")}>
        {value}
      </span>
    </div>
  );
}

export function ScreenDetailPanel({ screen, open, onClose, canManage, onEdit }: Props) {
  const [isPinging, startPing] = useTransition();
  const [isRemoving, startRemove] = useTransition();
  const router = useRouter();

  if (!screen) return null;

  const assignedCampaigns = screen.screenCampaigns ?? [];
  const assignedIds = assignedCampaigns.map((sc) => sc.campaignId);

  const handlePing = () => {
    if (!canManage) return;
    startPing(async () => {
      try {
        await pingScreen(screen.id);
        toast.success(`Ping enviado a ${screen.code}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo enviar el ping");
      }
    });
  };

  const handleRemoveCampaign = (campaignId: string, campaignName: string) => {
    startRemove(async () => {
      try {
        await removeCampaignFromScreen(screen.id, campaignId);
        toast.success(`"${campaignName}" desasignada`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al desasignar");
      }
    });
  };

  const isOnline = screen.status === "ONLINE";
  const aspect = screen.orientation === "portrait" ? "aspect-[3/4]" : "aspect-[16/9]";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile-only backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-50 bg-[#0B0B0B] border-l border-white/[0.06] shadow-[-20px_0_60px_rgba(0,0,0,0.6)] flex flex-col"
          >
            {/* ───────── header ───────── */}
            <div className="relative px-5 py-4 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label="Cerrar panel"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3 pr-10">
                <div className="w-10 h-10 rounded-xl bg-[#B8EB23]/10 border border-[#B8EB23]/20 flex items-center justify-center text-[#B8EB23] flex-shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold font-mono uppercase tracking-[0.1em] text-white/35">
                    {screen.code}
                  </p>
                  <h3 className="text-base font-bold text-white leading-tight mt-0.5 truncate">
                    {screen.name}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ScreenStatusBadge status={screen.status} size="sm" withIcon />
                    <span className="text-[11px] text-white/40">{getScreenTypeLabel(screen.type)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ───────── scrollable body ───────── */}
            <div className="flex-1 overflow-y-auto">
              {/* Live preview tile */}
              <div className="px-5 pt-5">
                <div
                  className={cn(
                    "relative rounded-xl overflow-hidden border border-white/[0.08] bg-[#080808]",
                    aspect,
                  )}
                >
                  {isOnline ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#B8EB23]/15 via-transparent to-[#B8EB23]/5" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="relative inline-flex">
                            <span className="absolute inset-0 rounded-full bg-[#B8EB23] opacity-60 animate-ping" />
                            <span className="relative w-2.5 h-2.5 rounded-full bg-[#B8EB23] shadow-[0_0_20px_rgba(184,235,35,0.6)]" />
                          </span>
                          <span className="text-[10px] font-mono text-white/50 tracking-wider">
                            {screen.resolutionWidth} × {screen.resolutionHeight}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#B8EB23]/80">
                            EMITIENDO
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <AlertCircle className="w-6 h-6 text-white/20" />
                        <span className="text-[10px] text-white/30 uppercase tracking-wider">Sin señal</span>
                      </div>
                    </div>
                  )}
                  {/* Scan line decoration when online */}
                  {isOnline && (
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "100%" }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-[#B8EB23]/10 to-transparent"
                    />
                  )}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/50 text-[9px] font-mono text-white/60">
                    {screen.code}
                  </div>
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/50 text-[9px] font-mono text-white/60 capitalize">
                    {screen.orientation}
                  </div>
                </div>
              </div>

              {/* ───────── ubicación ───────── */}
              <section className="px-5 py-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/35 mb-3">
                  Ubicación
                </p>
                <div className="space-y-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[#B8EB23]" />
                    <span className="text-sm font-semibold text-white">{screen.city}</span>
                  </div>
                  <div className="flex items-start gap-2 pl-5">
                    <MapPin className="w-3 h-3 text-white/30 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-white/55 leading-relaxed">{screen.address}</p>
                  </div>
                </div>
              </section>

              {/* ───────── telemetría ───────── */}
              <section className="px-5 pb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/35 mb-2">
                  Telemetría
                </p>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3">
                  <MetricRow
                    label="Tipo"
                    icon={<Cpu className="w-3.5 h-3.5" />}
                    value={getScreenTypeLabel(screen.type)}
                  />
                  <MetricRow
                    label="Dimensión"
                    icon={<Ruler className="w-3.5 h-3.5" />}
                    value={`${screen.width} × ${screen.height} m`}
                  />
                  <MetricRow
                    label="Resolución"
                    icon={<Maximize2 className="w-3.5 h-3.5" />}
                    value={`${screen.resolutionWidth} × ${screen.resolutionHeight}`}
                  />
                  <MetricRow
                    label="Tráfico diario"
                    icon={<Users className="w-3.5 h-3.5" />}
                    value={
                      <>
                        <span className="text-[#B8EB23]">{formatNumber(screen.dailyTraffic, true)}</span>
                        <span className="text-white/40"> /día</span>
                      </>
                    }
                  />
                  <MetricRow
                    label="Tarifa"
                    icon={<Activity className="w-3.5 h-3.5" />}
                    value={`$${formatNumber(screen.pricePerSecond)} /seg`}
                  />
                  <MetricRow
                    label="Último ping"
                    icon={<Signal className="w-3.5 h-3.5" />}
                    value={
                      screen.lastPingAt ? (
                        <span className={isOnline ? "text-[#B8EB23]" : "text-white/55"}>
                          {isOnline ? "Activo ahora" : formatRelativeTime(screen.lastPingAt)}
                        </span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )
                    }
                  />
                </div>
              </section>

              {/* ───────── campañas asignadas ───────── */}
              <section className="px-5 pb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">
                    Campañas asignadas
                  </p>
                  {canManage && (
                    <AssignCampaignsModal
                      screenId={screen.id}
                      screenName={screen.name}
                      assignedIds={assignedIds}
                    />
                  )}
                </div>

                {assignedCampaigns.length === 0 ? (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01]">
                    <Layers className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                    <p className="text-[11px] text-white/30">Sin campañas asignadas</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {assignedCampaigns.map((sc) => (
                      <div
                        key={sc.id}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-white truncate">
                            {sc.campaign.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <StatusBadge status={sc.campaign.status} size="sm" />
                            {sc.campaign.client && (
                              <span className="text-[10px] text-white/35 truncate">
                                · {sc.campaign.client.name}
                              </span>
                            )}
                          </div>
                        </div>
                        {canManage && (
                          <button
                            onClick={() => handleRemoveCampaign(sc.campaignId, sc.campaign.name)}
                            disabled={isRemoving}
                            className="p-1 rounded-md text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            title="Desasignar campaña"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ───────── meta ───────── */}
              {screen.createdAt && (
                <section className="px-5 pb-6">
                  <div className="flex items-center gap-2 text-[10px] text-white/30">
                    <Calendar className="w-3 h-3" />
                    <span>Registrada {formatRelativeTime(screen.createdAt)}</span>
                  </div>
                </section>
              )}
            </div>

            {/* ───────── footer actions ───────── */}
            {canManage && (
              <div className="px-5 py-4 border-t border-white/[0.06] bg-gradient-to-t from-white/[0.02] to-transparent flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  icon={<RefreshCw className={cn("w-3.5 h-3.5", isPinging && "animate-spin")} />}
                  onClick={handlePing}
                  loading={isPinging}
                >
                  Ping
                </Button>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    icon={<Pencil className="w-3.5 h-3.5" />}
                    onClick={() => onEdit(screen)}
                  >
                    Editar
                  </Button>
                )}
                <button
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors"
                  aria-label="Más opciones"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

