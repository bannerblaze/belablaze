"use client";

import { useState, useMemo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Filter, Plus, Eye, Pause, Play, Trash2,
  Copy, MoreHorizontal, ChevronDown, ChevronUp,
  ArrowUpDown, QrCode, Video, Image, Code, Zap,
  SlidersHorizontal, X, Paperclip,
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
import { updateAdStatus, deleteAd, submitAdForReview, assignMediaToAd, getOrgMediaAssets } from "@/actions/ads";
import { toast } from "sonner";

type OrgAsset = {
  id: string;
  name: string;
  type: string;
  mimeType: string | null;
  url: string | null;
  storageKey: string | null;
  size: number;
  createdAt: string;
};

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
  const [mediaPickerAdId, setMediaPickerAdId] = useState<string | null>(null);
  const [orgAssets, setOrgAssets] = useState<OrgAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  const openMediaPicker = async (adId: string) => {
    setMediaPickerAdId(adId);
    if (orgAssets.length === 0) {
      setAssetsLoading(true);
      try {
        const assets = await getOrgMediaAssets();
        setOrgAssets(assets as OrgAsset[]);
      } finally {
        setAssetsLoading(false);
      }
    }
  };

  const handleAssignMedia = (asset: OrgAsset) => {
    if (!mediaPickerAdId) return;
    startTransition(async () => {
      try {
        await assignMediaToAd(mediaPickerAdId, asset.id);
        setAds((prev) =>
          prev.map((a) =>
            a.id === mediaPickerAdId
              ? { ...a, fileUrl: asset.url ?? undefined, format: asset.type === "VIDEO" ? "VIDEO" : "IMAGE" }
              : a,
          ),
        );
        toast.success("Media asignada al anuncio");
        setMediaPickerAdId(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al asignar media");
      }
    });
  };

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
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg border flex-shrink-0 overflow-hidden flex items-center justify-center transition-all",
                            ad.fileUrl
                              ? "bg-[#B8EB23]/[0.08] border-[#B8EB23]/20 text-[#B8EB23]/60"
                              : "bg-white/[0.04] border-white/[0.06] border-dashed text-white/25 cursor-pointer hover:border-[#B8EB23]/30 hover:bg-[#B8EB23]/[0.04] hover:text-[#B8EB23]/50 group",
                          )}
                          onClick={!ad.fileUrl ? () => openMediaPicker(ad.id) : undefined}
                          title={ad.fileUrl ? "Media asignada" : "Clic para asignar media"}
                        >
                          {ad.fileUrl ? FORMAT_ICONS[ad.format] : <Paperclip className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white leading-none">{truncate(ad.title, 36)}</p>
                          <p className="text-[11px] text-white/35 mt-1">
                            {ad.duration}s · {ad.qrEnabled && "QR ·"} {formatDate(ad.createdAt, "dd MMM")}
                            {!ad.fileUrl && (
                              <button
                                onClick={() => openMediaPicker(ad.id)}
                                className="ml-1.5 text-[#B8EB23]/50 hover:text-[#B8EB23] transition-colors underline underline-offset-2"
                              >
                                Asignar media
                              </button>
                            )}
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

      {/* ── Media Picker Modal ── */}
      <AnimatePresence>
        {mediaPickerAdId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMediaPickerAdId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
                  <div>
                    <h3 className="text-base font-semibold text-white">Asignar media al anuncio</h3>
                    <p className="text-xs text-white/40 mt-0.5">Selecciona un archivo de tu biblioteca</p>
                  </div>
                  <button
                    onClick={() => setMediaPickerAdId(null)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.07] text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-5">
                  {assetsLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-5 h-5 rounded-full border-2 border-[#B8EB23]/30 border-t-[#B8EB23] animate-spin" />
                    </div>
                  ) : orgAssets.length === 0 ? (
                    <div className="text-center py-16">
                      <Paperclip className="w-8 h-8 text-white/15 mx-auto mb-3" />
                      <p className="text-sm text-white/40">No hay media en tu biblioteca</p>
                      <p className="text-xs text-white/25 mt-1">Sube archivos desde la sección Media</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {orgAssets.map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => handleAssignMedia(asset)}
                          disabled={isPending}
                          className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-[#B8EB23]/40 hover:bg-[#B8EB23]/[0.04] transition-all text-left group disabled:opacity-50"
                        >
                          <div className="w-full aspect-video rounded-lg bg-white/[0.05] flex items-center justify-center overflow-hidden">
                            {asset.type === "VIDEO" ? (
                              <Video className="w-6 h-6 text-white/30 group-hover:text-[#B8EB23]/60 transition-colors" />
                            ) : asset.url ? (
                              <img
                                src={asset.url}
                                alt={asset.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const t = e.target as HTMLImageElement;
                                  t.style.display = "none";
                                  t.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                                }}
                              />
                            ) : (
                              <Image className="w-6 h-6 text-white/30 group-hover:text-[#B8EB23]/60 transition-colors" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white/80 truncate">{asset.name}</p>
                            <p className="text-[10px] text-white/35 mt-0.5 uppercase tracking-wide">{asset.type}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
