import { Layers, Film, GripVertical, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ScreenDetailData, AssignedCampaign } from "@/services/screen-details.service";

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

function CampaignSection({ sc, index }: { sc: AssignedCampaign; index: number }) {
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

export function ScreenPlaylistCard({ data }: Props) {
  const hasCampaigns = data.campaigns.length > 0;

  return (
    <Card className="h-full">
      <CardHeader
        title="Playlist de contenido"
        subtitle={`${data.campaigns.length} campaña${data.campaigns.length !== 1 ? "s" : ""} asignada${data.campaigns.length !== 1 ? "s" : ""} · orden por prioridad`}
        icon={<Layers className="w-4 h-4" />}
        action={
          hasCampaigns ? (
            <Badge variant="brand" size="sm">{data.metrics.activeAds} activos</Badge>
          ) : null
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
              <CampaignSection key={sc.id} sc={sc} index={i} />
            ))}
            <p className="text-[10px] text-white/20 text-center pt-1">
              Drag & drop para reordenar · próximamente
            </p>
          </>
        )}

        {/* Time-based schedules section */}
        {data.schedules.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.04]">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/30 mb-2.5">
              Programación horaria ({data.schedules.length})
            </p>
            <div className="space-y-1.5">
              {data.schedules.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] font-mono text-white/50 flex-shrink-0">
                    {s.startTime}–{s.endTime}
                  </span>
                  <span className="flex-1 text-[11px] text-white/60 truncate">{s.ad.title}</span>
                  <span className="text-[10px] text-white/30">{s.ad.duration}s</span>
                  {!s.isActive && <Badge variant="outline" size="sm">Inactivo</Badge>}
                </div>
              ))}
              {data.schedules.length > 5 && (
                <p className="text-[10px] text-white/25 text-center">
                  +{data.schedules.length - 5} más
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
