import { Play, Pause, Film, Layers, Clock, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScreenDetailData } from "@/services/screen-details.service";

/* ──────────────────────────────────────────────────────────────────────
 * ScreenPlaybackCard — current/next content state.
 *
 * Shows what is likely playing NOW based on server-computed nowPlaying
 * (derived from ScreenCampaign + AdSchedule). Prepared for realtime
 * updates — the AutoRefresher keeps this fresh every 30 s.
 * ────────────────────────────────────────────────────────────────────── */

interface Props { data: ScreenDetailData }

function StandbyState({ isOnline }: { isOnline: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 gap-3 rounded-xl border",
      isOnline
        ? "bg-[#B8EB23]/[0.03] border-[#B8EB23]/10"
        : "bg-white/[0.02] border-white/[0.04]",
    )}>
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center",
        isOnline ? "bg-[#B8EB23]/10" : "bg-white/[0.04]",
      )}>
        <Pause className={cn("w-5 h-5", isOnline ? "text-[#B8EB23]/60" : "text-white/20")} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white/50">En espera</p>
        <p className="text-[11px] text-white/30 mt-0.5">
          {isOnline ? "Sin contenido programado ahora" : "Pantalla sin conexión"}
        </p>
      </div>
    </div>
  );
}

export function ScreenPlaybackCard({ data }: Props) {
  const isOnline = data.status === "ONLINE";
  const np = data.nowPlaying;

  /* Next up — first ad from the highest-priority campaign that isn't currently playing */
  const nextAd = (() => {
    for (const sc of data.campaigns) {
      if (!sc.isActive || sc.campaign.status !== "ACTIVE") continue;
      const ad = sc.campaign.ads.find(
        (a) => ["ACTIVE", "PUBLISHED"].includes(a.status) && (!np || a.id !== np.adId),
      );
      if (ad) return { title: ad.title, campaignName: sc.campaign.name, duration: ad.duration };
    }
    return null;
  })();

  return (
    <Card className="h-full">
      <CardHeader
        title="Reproducción actual"
        subtitle="Contenido programado en este momento"
        icon={<Play className="w-4 h-4" />}
        action={
          isOnline ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#B8EB23]/10 border border-[#B8EB23]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8EB23] animate-pulse" />
              <span className="text-[10px] font-bold text-[#B8EB23] tracking-wide">LIVE</span>
            </div>
          ) : null
        }
      />
      <CardContent className="pt-4 space-y-3">
        {!np ? (
          <StandbyState isOnline={isOnline} />
        ) : (
          <>
            {/* Now playing */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#B8EB23]/[0.08] via-white/[0.02] to-transparent border border-[#B8EB23]/15 p-4">
              {/* Scan line animation */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B8EB23]/40 to-transparent animate-[scan_3s_linear_infinite]" />

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B8EB23]/10 flex items-center justify-center flex-shrink-0">
                  <Film className="w-4 h-4 text-[#B8EB23]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#B8EB23]/60">
                      {np.source === "schedule" ? "Programado" : "Campaña"} · En curso
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white truncate">{np.title}</p>
                  <p className="text-[11px] text-white/45 mt-0.5 truncate">{np.campaignName}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-mono text-white/50">{np.duration}s</p>
                  <StatusBadge status="ACTIVE" size="sm" />
                </div>
              </div>

              {/* Duration bar (decorative, cycles every `duration` seconds) */}
              <div className="mt-3 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-[#B8EB23] rounded-full"
                  style={{
                    width: "60%",
                    transition: "width linear",
                    background: "linear-gradient(to right, #B8EB23, #D4F564)",
                  }}
                />
              </div>
            </div>

            {/* Duration info */}
            <div className="flex items-center gap-3 px-1">
              <Clock className="w-3 h-3 text-white/30" />
              <span className="text-[11px] text-white/40">
                Duración: <span className="text-white/70 font-mono">{np.duration}s</span>
              </span>
              <span className="text-white/15">·</span>
              <span className="text-[11px] text-white/40">
                Fuente: <span className="text-white/60 capitalize">{np.source === "schedule" ? "horario" : "campaña"}</span>
              </span>
            </div>
          </>
        )}

        {/* Next up */}
        {nextAd && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex-shrink-0">
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                Próximo
              </span>
            </div>
            <ChevronRight className="w-3 h-3 text-white/20 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white/70 truncate">{nextAd.title}</p>
              <p className="text-[10px] text-white/35 truncate">{nextAd.campaignName}</p>
            </div>
            <span className="text-[11px] font-mono text-white/35 flex-shrink-0">{nextAd.duration}s</span>
          </div>
        )}

        {/* Playlist summary */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
          <span className="text-[11px] text-white/30">
            {data.campaigns.length} campaña{data.campaigns.length !== 1 ? "s" : ""} ·{" "}
            {data.metrics.activeAds} anuncio{data.metrics.activeAds !== 1 ? "s" : ""} activo{data.metrics.activeAds !== 1 ? "s" : ""}
          </span>
          <span className="text-[10px] font-mono text-white/20">
            {data.status}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
