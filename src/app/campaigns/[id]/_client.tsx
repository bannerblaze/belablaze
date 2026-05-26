"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft, Eye, DollarSign, Calendar, MapPin,
  Layers, MonitorPlay, Play, Pause, Trash2,
  ArrowUpRight, Video, Image, Code, Zap, CheckCircle2,
  AlertTriangle, Clock, BarChart3, Edit3,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatCurrency, formatNumber, formatDate,
  formatRelativeTime, getStatusConfig, getFormatConfig, cn,
} from "@/lib/utils";
import { updateCampaignStatus, deleteCampaign } from "@/actions/campaigns";
import { toast } from "sonner";

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  IMAGE: <Image className="w-4 h-4" />,
  VIDEO: <Video className="w-4 h-4" />,
  HTML5: <Code className="w-4 h-4" />,
  INTERACTIVE: <Zap className="w-4 h-4" />,
};

type CampaignDetail = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  conversions: number;
  engagements: number;
  startDate: string;
  endDate: string;
  targetCities: string[];
  client?: { id: string; name: string; industry?: string | null } | null;
  user?: { id: string; name: string; email: string } | null;
  ads?: Array<{
    id: string; title: string; status: string; format: string;
    impressions: number; clicks: number; ctr: number; duration: number;
  }> | null;
  screens?: Array<{
    screen: { id: string; name: string; city: string; status: string; code: string };
  }> | null;
  createdAt: string;
  updatedAt: string;
};

interface CampaignDetailClientProps {
  campaign: CampaignDetail;
}

export function CampaignDetailClient({ campaign }: CampaignDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const pct = campaign.budget > 0 ? Math.min(100, Math.round((campaign.spent / campaign.budget) * 100)) : 0;
  // Computed once when endDate changes. Date.now is non-deterministic per render
  // but for "days left" the second-level accuracy is irrelevant; useMemo + endDate dep is enough.
  const daysLeft = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / 86400000)),
    [campaign.endDate]
  );
  const cfg = getStatusConfig(campaign.status);

  const handleStatusToggle = () => {
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : campaign.status === "PAUSED" ? "ACTIVE" : "ACTIVE";
    startTransition(async () => {
      const result = await updateCampaignStatus(campaign.id, newStatus);
      if (result?.success) {
        toast.success(newStatus === "ACTIVE" ? "Campaña activada" : "Campaña pausada");
      } else {
        toast.error("Error al actualizar estado");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteCampaign(campaign.id);
        toast.success("Campaña eliminada");
        router.push("/campaigns");
      } catch {
        toast.error("Sin permisos para eliminar esta campaña");
        setShowDeleteConfirm(false);
      }
    });
  };

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: i * 0.06 },
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 space-y-5 max-w-[1200px]">
      {/* Header */}
      <motion.div {...stagger(0)} className="flex items-start gap-4">
        <button
          onClick={() => router.push("/campaigns")}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white transition-all mt-0.5 flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-bold text-white leading-tight">{campaign.name}</h1>
            <StatusBadge status={campaign.status} showDot />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {campaign.client && (
              <span className="text-sm text-white/40">{campaign.client.name}</span>
            )}
            {campaign.client?.industry && (
              <>
                <span className="text-white/20">·</span>
                <Badge variant="outline" size="sm">{campaign.client.industry}</Badge>
              </>
            )}
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/30">Creado {formatRelativeTime(campaign.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {(campaign.status === "ACTIVE" || campaign.status === "PAUSED" || campaign.status === "DRAFT") && (
            <Button
              variant={campaign.status === "ACTIVE" ? "outline" : "brand"}
              size="sm"
              loading={isPending}
              onClick={handleStatusToggle}
              icon={campaign.status === "ACTIVE" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            >
              {campaign.status === "ACTIVE" ? "Pausar" : "Activar"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
          />
        </div>
      </motion.div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-white">¿Eliminar campaña &ldquo;<strong>{campaign.name}</strong>&rdquo;? Esta acción no se puede deshacer.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
            <Button variant="danger" size="sm" loading={isPending} onClick={handleDelete}>Eliminar</Button>
          </div>
        </motion.div>
      )}

      {/* Metrics row */}
      <motion.div {...stagger(1)} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Presupuesto", value: formatCurrency(campaign.budget), icon: <DollarSign className="w-4 h-4" />, sub: `${pct}% usado` },
          { label: "Impresiones", value: formatNumber(campaign.impressions, true), icon: <Eye className="w-4 h-4" />, sub: "totales" },
          { label: "Anuncios", value: campaign.ads?.length ?? 0, icon: <Layers className="w-4 h-4" />, sub: "en campaña" },
          { label: "Días restantes", value: campaign.status === "COMPLETED" ? "—" : `${daysLeft}d`, icon: <Calendar className="w-4 h-4" />, sub: formatDate(campaign.endDate) },
        ].map((m, i) => (
          <div key={m.label} className="rounded-xl border border-white/[0.06] bg-[#111111] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/50">{m.icon}</div>
            </div>
            <p className="text-xl font-bold text-white">{m.value}</p>
            <p className="text-xs text-white/40 mt-1">{m.label}</p>
            <p className="text-[11px] text-white/25 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Budget progress */}
      <motion.div {...stagger(2)}>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Ejecución de presupuesto</p>
              <span className={cn("text-sm font-bold", pct > 90 ? "text-red-400" : pct > 70 ? "text-yellow-400" : "text-[#B8EB23]")}>{pct}%</span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className={cn("h-full rounded-full", pct > 90 ? "bg-red-400" : pct > 70 ? "bg-yellow-400" : "bg-[#B8EB23]")}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-white/30">
              <span>{formatCurrency(campaign.spent)} gastado</span>
              <span>{formatCurrency(campaign.budget - campaign.spent)} restante</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Ads list */}
        <motion.div {...stagger(3)} className="xl:col-span-2">
          <Card>
            <CardHeader
              title="Anuncios"
              subtitle={`${campaign.ads?.length ?? 0} en esta campaña`}
              action={
                <Link href={`/ads/new?campaignId=${campaign.id}`}>
                  <Button variant="brand" size="sm" icon={<Zap className="w-3.5 h-3.5" />}>
                    Nuevo anuncio
                  </Button>
                </Link>
              }
            />
            <CardContent className="pt-0">
              {campaign.ads && campaign.ads.length > 0 ? (
                <div className="space-y-2 pt-4">
                  {campaign.ads.map((ad) => {
                    const fmtCfg = getFormatConfig(ad.format);
                    return (
                      <div
                        key={ad.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all"
                      >
                        <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 flex-shrink-0">
                          {FORMAT_ICONS[ad.format]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">{ad.title}</p>
                            <StatusBadge status={ad.status} size="sm" />
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[11px] text-white/35">{fmtCfg.label} · {ad.duration}s</span>
                            <span className="text-white/20">·</span>
                            <span className="text-[11px] text-white/35">{formatNumber(ad.impressions, true)} imp.</span>
                            <span className="text-white/20">·</span>
                            <span className="text-[11px] text-white/35">{ad.ctr.toFixed(2)}% CTR</span>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <Layers className="w-8 h-8 text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-white/30">Sin anuncios aún</p>
                  <Link href={`/ads/new?campaignId=${campaign.id}`}>
                    <button className="text-xs text-[#B8EB23] hover:underline mt-2">Crear primer anuncio →</button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar info */}
        <motion.div {...stagger(4)} className="space-y-4">
          {/* Campaign info */}
          <Card>
            <CardHeader title="Información" icon={<BarChart3 className="w-4 h-4" />} />
            <CardContent className="pt-4 space-y-0">
              {[
                { label: "Estado", value: <StatusBadge status={campaign.status} size="sm" showDot /> },
                { label: "Gestor", value: <span className="text-xs text-white/70">{campaign.user?.name ?? "—"}</span> },
                { label: "Inicio", value: <span className="text-xs text-white/70">{formatDate(campaign.startDate)}</span> },
                { label: "Fin", value: <span className="text-xs text-white/70">{formatDate(campaign.endDate)}</span> },
                {
                  label: "Ciudades",
                  value: campaign.targetCities.length > 0
                    ? <div className="flex flex-wrap gap-1">{campaign.targetCities.map((c) => <Badge key={c} variant="outline" size="sm">{c}</Badge>)}</div>
                    : <span className="text-xs text-white/30">—</span>
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-xs text-white/40 flex-shrink-0">{label}</span>
                  <div className="flex-1 flex justify-end">{value}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Screens */}
          {campaign.screens && campaign.screens.length > 0 && (
            <Card>
              <CardHeader title="Pantallas asignadas" icon={<MonitorPlay className="w-4 h-4" />} subtitle={`${campaign.screens.length} pantallas`} />
              <CardContent className="pt-4 space-y-2">
                {campaign.screens.map(({ screen }) => {
                  const sCfg = getStatusConfig(screen.status);
                  return (
                    <div key={screen.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sCfg.dot}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{screen.name.split("—")[0].trim()}</p>
                        <p className="text-[10px] text-white/35">{screen.city} · {screen.code}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {campaign.description && (
            <Card>
              <CardHeader title="Descripción" />
              <CardContent className="pt-4">
                <p className="text-sm text-white/60 leading-relaxed">{campaign.description}</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
