"use client";

import { useState, useTransition } from "react";
import { Layers, Film, GripVertical, ChevronDown, Trash2, Plus, X } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ScreenDetailData, AssignedCampaign } from "@/services/screen-details.service";
import { AssignCampaignButton, RemoveCampaignButton } from "./screen-campaign-assign";
import { createAdSchedule, toggleAdSchedule, deleteAdSchedule } from "@/actions/schedules";

/* ──────────────────────────────────────────────────────────────────────
 * ScreenPlaylistCard — campaign and ad assignment list.
 *
 * Shows ScreenCampaign assignments in priority order.
 * Each campaign expands to show its individual ads.
 * Drag-and-drop reordering is prepared (GripVertical handles visible).
 * ────────────────────────────────────────────────────────────────────── */

interface Props { data: ScreenDetailData }

const FORMAT_LABELS: Record<string, string> = {
  IMAGE: "IMG", VIDEO: "VID", HTML5: "HTML", INTERACTIVE: "INT",
};

const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];
const DAY_FULL   = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function AdRow({ ad }: { ad: AssignedCampaign["campaign"]["ads"][number] }) {
  const isActive = ["ACTIVE", "PUBLISHED"].includes(ad.status);
  return (
    <div className={cn(
      "flex items-center gap-2.5 py-2 px-3 rounded-lg border transition-colors",
      isActive
        ? "bg-white/[0.025] border-white/[0.05]"
        : "bg-white/[0.01] border-white/[0.03] opacity-60",
    )}>
      <Film className="w-3 h-3 text-white/30 flex-shrink-0" />
      <span className="flex-1 text-[11px] font-medium text-white/75 truncate">{ad.title}</span>
      <Badge variant="outline" size="sm">{FORMAT_LABELS[ad.format] ?? ad.format}</Badge>
      <span className="text-[10px] font-mono text-white/35 flex-shrink-0">{ad.duration}s</span>
      <StatusBadge status={ad.status} size="sm" />
    </div>
  );
}

function CampaignSection({ sc, index, screenId }: { sc: AssignedCampaign; index: number; screenId: string }) {
  const isActive = sc.campaign.status === "ACTIVE" && sc.isActive;
  const activeAds = sc.campaign.ads.filter((a) => ["ACTIVE", "PUBLISHED"].includes(a.status)).length;

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden transition-colors",
      isActive
        ? "border-white/[0.07] bg-white/[0.025]"
        : "border-white/[0.04] bg-white/[0.01] opacity-70",
    )}>
      {/* Campaign header */}
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        {/* Drag handle placeholder */}
        <GripVertical className="w-3.5 h-3.5 text-white/15 flex-shrink-0 cursor-grab" />

        {/* Priority badge */}
        <span className={cn(
          "w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0",
          sc.priority > 0 ? "bg-[#B8EB23]/15 text-[#B8EB23]/80" : "bg-white/[0.06] text-white/35",
        )}>
          {index + 1}
        </span>

        <Layers className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-[#B8EB23]/60" : "text-white/25")} />

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-white truncate">{sc.campaign.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {sc.campaign.client && (
              <span className="text-[10px] text-white/40 truncate">{sc.campaign.client.name}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-white/35">
            {activeAds}/{sc.campaign.ads.length} ads
          </span>
          <StatusBadge status={sc.campaign.status} size="sm" />
          <RemoveCampaignButton screenId={screenId} campaignId={sc.campaignId} />
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
      </div>

      {/* Ads list */}
      {sc.campaign.ads.length > 0 && (
        <div className="px-3.5 pb-3 space-y-1.5 border-t border-white/[0.04] pt-2.5">
          {sc.campaign.ads.map((ad) => <AdRow key={ad.id} ad={ad} />)}
        </div>
      )}

      {sc.campaign.ads.length === 0 && (
        <div className="px-3.5 pb-3 pt-1">
          <p className="text-[11px] text-white/25 italic">Sin anuncios en esta campaña</p>
        </div>
      )}
    </div>
  );
}

/* ── Schedule form ── */
interface ScheduleFormProps {
  screenId: string;
  availableAds: { id: string; title: string; campaignName: string }[];
  onClose: () => void;
}

function ScheduleForm({ screenId, availableAds, onClose }: ScheduleFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [adId, setAdId]           = useState(availableAds[0]?.id ?? "");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime]     = useState("10:00");
  const [days, setDays]           = useState<number[]>([1, 2, 3, 4, 5]);

  function toggleDay(d: number) {
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await createAdSchedule({ adId, screenId, startTime, endTime, daysOfWeek: days });
        if (!result.ok) { setError(result.error); return; }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-3.5 rounded-xl border border-[#B8EB23]/20 bg-[#B8EB23]/[0.03] space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-white/70 uppercase tracking-[0.08em]">Nuevo horario</p>
        <button type="button" onClick={onClose} className="p-1 rounded-md text-white/30 hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ad selector */}
      <div className="space-y-1">
        <label className="text-[10px] text-white/40 font-medium">Anuncio</label>
        {availableAds.length === 0 ? (
          <p className="text-[11px] text-white/30 italic">Sin anuncios activos en campañas asignadas</p>
        ) : (
          <select
            value={adId}
            onChange={(e) => setAdId(e.target.value)}
            required
            className="w-full h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[12px] text-white/80 focus:outline-none focus:border-[#B8EB23]/40 focus:ring-1 focus:ring-[#B8EB23]/20 transition-all"
          >
            {availableAds.map((ad) => (
              <option key={ad.id} value={ad.id} className="bg-[#0A0A0C] text-white/80">
                {ad.title} — {ad.campaignName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Time range */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] text-white/40 font-medium">Inicio</label>
          <Input
            type="time"
            inputSize="sm"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-[10px] text-white/40 font-medium">Fin</label>
          <Input
            type="time"
            inputSize="sm"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Days */}
      <div className="space-y-1">
        <label className="text-[10px] text-white/40 font-medium">Días</label>
        <div className="flex gap-1">
          {DAY_FULL.map((label, d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={cn(
                "flex-1 h-7 rounded-md text-[10px] font-semibold transition-all border",
                days.includes(d)
                  ? "bg-[#B8EB23]/15 border-[#B8EB23]/30 text-[#B8EB23]"
                  : "bg-white/[0.03] border-white/[0.06] text-white/30 hover:text-white/50",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="brand" size="sm" loading={pending} disabled={availableAds.length === 0}>
          Guardar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/* ── Schedule row with toggle and delete ── */
interface ScheduleRowProps {
  schedule: ScreenDetailData["schedules"][number];
  screenId: string;
}

function ScheduleRow({ schedule: s, screenId }: ScheduleRowProps) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      try { await toggleAdSchedule(s.id, screenId); } catch { /* silent */ }
    });
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar el horario ${s.startTime}–${s.endTime} para "${s.ad.title}"?`)) return;
    startTransition(async () => {
      try { await deleteAdSchedule(s.id, screenId); } catch { /* silent */ }
    });
  }

  return (
    <div className={cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors",
      s.isActive ? "bg-white/[0.02] border-white/[0.04]" : "bg-white/[0.01] border-white/[0.03] opacity-60",
    )}>
      <span className="text-[10px] font-mono text-white/50 flex-shrink-0">
        {s.startTime}–{s.endTime}
      </span>

      {/* Day badges */}
      <div className="flex gap-0.5 flex-shrink-0">
        {s.daysOfWeek.map((d) => (
          <span key={d} className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold bg-white/[0.05] text-white/40">
            {DAY_LABELS[d]}
          </span>
        ))}
      </div>

      <span className="flex-1 text-[11px] text-white/60 truncate">{s.ad.title}</span>
      <span className="text-[10px] text-white/30 flex-shrink-0">{s.ad.duration}s</span>

      <button
        onClick={handleToggle}
        disabled={pending}
        title={s.isActive ? "Desactivar" : "Activar"}
        className="flex-shrink-0"
      >
        <Badge
          variant={s.isActive ? "brand" : "outline"}
          size="sm"
          className="cursor-pointer hover:opacity-70 transition-opacity"
        >
          {s.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </button>

      <button
        onClick={handleDelete}
        disabled={pending}
        title="Eliminar horario"
        className="flex-shrink-0 p-1 rounded-md text-white/20 hover:text-red-400 hover:bg-red-400/[0.08] transition-all"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

export function ScreenPlaylistCard({ data }: Props) {
  const hasCampaigns = data.campaigns.length > 0;
  const [showForm, setShowForm] = useState(false);

  // Collect all active ads from assigned active campaigns for the schedule form
  const availableAds = data.campaigns
    .filter((sc) => sc.campaign.status === "ACTIVE")
    .flatMap((sc) =>
      sc.campaign.ads
        .filter((ad) => ["ACTIVE", "PUBLISHED"].includes(ad.status))
        .map((ad) => ({ id: ad.id, title: ad.title, campaignName: sc.campaign.name })),
    );

  return (
    <Card className="h-full">
      <CardHeader
        title="Playlist de contenido"
        subtitle={`${data.campaigns.length} campaña${data.campaigns.length !== 1 ? "s" : ""} asignada${data.campaigns.length !== 1 ? "s" : ""} · orden por prioridad`}
        icon={<Layers className="w-4 h-4" />}
        action={
          <div className="flex items-center gap-2">
            {hasCampaigns && <Badge variant="brand" size="sm">{data.metrics.activeAds} activos</Badge>}
            <AssignCampaignButton
              screenId={data.id}
              currentCampaignIds={data.campaigns.map((c) => c.campaignId)}
            />
          </div>
        }
      />
      <CardContent className="pt-4 space-y-2.5">
        {!hasCampaigns ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed border-white/[0.07]">
            <Layers className="w-8 h-8 text-white/15" />
            <div className="text-center">
              <p className="text-sm text-white/40 font-medium">Sin campañas asignadas</p>
              <p className="text-[11px] text-white/25 mt-1">
                Asigna campañas desde el panel lateral en{" "}
                <Link href="/screens" className="text-[#B8EB23]/60 hover:text-[#B8EB23] transition-colors">
                  Pantallas
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <>
            {data.campaigns.map((sc, i) => (
              <CampaignSection key={sc.id} sc={sc} index={i} screenId={data.id} />
            ))}
            <p className="text-[10px] text-white/20 text-center pt-1">
              Drag & drop para reordenar · próximamente
            </p>
          </>
        )}

        {/* Time-based schedules section */}
        <div className="mt-4 pt-4 border-t border-white/[0.04]">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/30">
              Programación horaria ({data.schedules.length})
            </p>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-[#B8EB23]/70 hover:text-[#B8EB23] hover:bg-[#B8EB23]/[0.08] transition-all"
            >
              <Plus className="w-3 h-3" />
              Nuevo horario
            </button>
          </div>

          {showForm && (
            <ScheduleForm
              screenId={data.id}
              availableAds={availableAds}
              onClose={() => setShowForm(false)}
            />
          )}

          {data.schedules.length === 0 && !showForm ? (
            <p className="text-[11px] text-white/25 italic px-1">Sin horarios configurados</p>
          ) : (
            <div className="space-y-1.5">
              {data.schedules.map((s) => (
                <ScheduleRow key={s.id} schedule={s} screenId={data.id} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
