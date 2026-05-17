"use client";

import { useState, useMemo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Filter, Plus, Eye, Pause, Play, Trash2,
  Copy, MoreHorizontal, ChevronDown, ChevronUp,
  ArrowUpDown, QrCode, Video, Image, Code, Zap,
  SlidersHorizontal, X,
} from "lucide-react";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
type CampaignRef = { id: string; name: string; client?: { name: string } | null };
import {
  formatNumber, formatDate, formatRelativeTime,
  getFormatConfig, getStatusConfig, truncate, cn,
} from "@/lib/utils";
import type { Ad, AdStatus, AdFormat } from "@/types";
import { updateAdStatus, deleteAd, submitAdForReview } from "@/actions/ads";
import { toast } from "sonner";

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "ACTIVE", label: "Activos" },
  { value: "PENDING_REVIEW", label: "En revisión" },
  { value: "APPROVED", label: "Aprobados" },
  { value: "REJECTED", label: "Rechazados" },
  { value: "PAUSED", label: "Pausados" },
  { value: "DRAFT", label: "Borradores" },
];

const FORMAT_ICONS: Record<AdFormat, React.ReactNode> = {
  IMAGE: <Image className="w-3.5 h-3.5" />,
  VIDEO: <Video className="w-3.5 h-3.5" />,
  HTML5: <Code className="w-3.5 h-3.5" />,
  INTERACTIVE: <Zap className="w-3.5 h-3.5" />,
};

function ActionMenu({ ad, onAction }: { ad: Ad; onAction: (id: string, action: "toggle" | "delete" | "submit") => void }) {
  const [open, setOpen] = useState(false);

  const canPauseOrActivate = ad.status === "ACTIVE" || ad.status === "PAUSED";
  const canSubmit = ad.status === "DRAFT";

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white transition-all"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
            >
              {[
                canPauseOrActivate && {
                  icon: ad.status === "PAUSED" ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />,
                  label: ad.status === "PAUSED" ? "Activar" : "Pausar",
                  onClick: () => onAction(ad.id, "toggle"),
                },
                canSubmit && {
                  icon: <Eye className="w-3.5 h-3.5" />,
                  label: "Enviar a revisión",
                  onClick: () => onAction(ad.id, "submit"),
                },
                {
                  icon: <Trash2 className="w-3.5 h-3.5" />,
                  label: "Eliminar",
                  onClick: () => onAction(ad.id, "delete"),
                  danger: true,
                },
              ]
                .filter(Boolean)
                .map((action) => {
                  if (!action) return null;
                  return (
                    <button
                      key={action.label}
                      onClick={(e) => { e.stopPropagation(); action.onClick(); setOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors",
                        action.danger
                          ? "text-red-400 hover:bg-red-400/10"
                          : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                      )}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  );
                })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdsClient({ initialAds, campaigns }: { initialAds: Ad[]; campaigns: CampaignRef[] }) {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"date" | "impressions" | "ctr">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAction = (id: string, action: "toggle" | "delete" | "submit") => {
    const ad = ads.find((a) => a.id === id);
    if (!ad) return;

    startTransition(async () => {
      try {
        if (action === "delete") {
          await deleteAd(id);
          setAds((prev) => prev.filter((a) => a.id !== id));
          toast.success("Anuncio eliminado");
        } else if (action === "toggle") {
          const newStatus = ad.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
          await updateAdStatus(id, newStatus as "ACTIVE" | "PAUSED");
          setAds((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
          toast.success(newStatus === "PAUSED" ? "Anuncio pausado" : "Anuncio activado");
        } else if (action === "submit") {
          await submitAdForReview(id);
          setAds((prev) => prev.map((a) => a.id === id ? { ...a, status: "PENDING_REVIEW" } : a));
          toast.success("Anuncio enviado a revisión");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al realizar la acción";
        toast.error(msg);
      }
    });
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = [...ads];
    if (search) list = list.filter(a =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.campaign?.name?.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    list.sort((a, b) => {
      const mult = sortDir === "asc" ? 1 : -1;
      if (sortBy === "impressions") return (a.impressions - b.impressions) * mult;
      if (sortBy === "ctr") return (a.ctr - b.ctr) * mult;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * mult;
    });
    return list;
  }, [search, statusFilter, sortBy, sortDir, ads]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(a => a.id)));
  };

  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const pendingCount = ads.filter(a => a.status === "PENDING_REVIEW").length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1600px]">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total anuncios" value={ads.length} icon={<Zap className="w-5 h-5" />} index={0} />
        <MetricCard title="Impresiones totales" value={totalImpressions} icon={<Eye className="w-5 h-5" />} highlight index={1} />
        <MetricCard title="CTR promedio" value={`${avgCTR.toFixed(2)}%`} icon={<ArrowUpDown className="w-5 h-5" />} index={2} />
        <MetricCard title="Pendientes revisión" value={pendingCount} icon={<Filter className="w-5 h-5" />} index={3} />
      </div>

      {/* Table */}
      <Card>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Buscar anuncios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3.5 pr-9 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#B8EB23]/40 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status filters */}
            <div className="hidden md:flex items-center gap-1 overflow-x-auto scroll-x">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                    statusFilter === f.value
                      ? "bg-[#B8EB23]/10 text-[#B8EB23] border border-[#B8EB23]/20"
                      : "text-white/40 hover:text-white hover:bg-white/[0.05] border border-transparent"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs text-white/50">{selectedIds.size} seleccionados</span>
                <Button variant="ghost" size="sm" icon={<Pause className="w-3.5 h-3.5" />}>Pausar</Button>
                <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />}>Eliminar</Button>
              </motion.div>
            )}
            <Link href="/ads/new">
              <Button variant="brand" size="sm" icon={<Plus className="w-4 h-4" />}>
                Nuevo anuncio
              </Button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 accent-[#B8EB23] cursor-pointer"
                  />
                </th>
                {[
                  { label: "Anuncio", key: null },
                  { label: "Estado", key: null },
                  { label: "Formato", key: null },
                  { label: "Campaña", key: null },
                  { label: "Impresiones", key: "impressions" as const },
                  { label: "CTR", key: "ctr" as const },
                  { label: "QR Scans", key: null },
                  { label: "Fecha", key: "date" as const },
                  { label: "", key: null },
                ].map((col, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.key ? (
                      <button
                        onClick={() => toggleSort(col.key!)}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        {col.label}
                        {sortBy === col.key ? (
                          sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    ) : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ad, i) => {
                const campaign = campaigns.find(c => c.id === ad.campaignId) ?? ad.campaign;
                const formatCfg = getFormatConfig(ad.format);
                const isSelected = selectedIds.has(ad.id);
                return (
                  <motion.tr
                    key={ad.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "border-b border-white/[0.04] transition-colors group",
                      isSelected ? "bg-[#B8EB23]/[0.03]" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(ad.id)}
                        className="w-3.5 h-3.5 accent-[#B8EB23] cursor-pointer"
                      />
                    </td>

                    {/* Title + thumbnail */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 flex-shrink-0 overflow-hidden">
                          {ad.thumbnailUrl ? (
                            <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                              {FORMAT_ICONS[ad.format]}
                            </div>
                          ) : FORMAT_ICONS[ad.format]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white leading-none">{truncate(ad.title, 36)}</p>
                          <p className="text-[11px] text-white/35 mt-1">
                            {ad.duration}s · {ad.qrEnabled && "QR ·"} {formatDate(ad.createdAt, "dd MMM")}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={ad.status} size="sm" />
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-white/50">
                        {FORMAT_ICONS[ad.format]}
                        {formatCfg.label}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-xs text-white/60 truncate max-w-[140px] block">
                        {truncate(campaign?.name ?? "—", 24)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-white tabular-nums">
                        {formatNumber(ad.impressions, true)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-semibold tabular-nums",
                          ad.ctr >= 3 ? "text-[#B8EB23]" : ad.ctr >= 1.5 ? "text-white" : "text-white/50"
                        )}>
                          {ad.ctr.toFixed(2)}%
                        </span>
                        {ad.ctr >= 3 && <Badge variant="brand" size="sm">Top</Badge>}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        {ad.qrEnabled ? (
                          <span className="flex items-center gap-1 text-purple-400">
                            <QrCode className="w-3 h-3" />
                            {formatNumber(ad.qrScans, true)}
                          </span>
                        ) : (
                          <span className="text-white/25">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-xs text-white/40">{formatRelativeTime(ad.createdAt)}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <ActionMenu ad={ad} onAction={handleAction} />
                    </td>
                  </motion.tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <p className="text-sm text-white/30">No se encontraron anuncios con los filtros actuales.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
          <span className="text-xs text-white/30">{filtered.length} anuncio{filtered.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.05] transition-all">Anterior</button>
            <span className="w-7 h-7 rounded-lg bg-[#B8EB23]/10 border border-[#B8EB23]/20 text-[#B8EB23] text-xs flex items-center justify-center font-medium">1</span>
            <button className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.05] transition-all">Siguiente</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
