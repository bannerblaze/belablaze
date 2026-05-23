import { Play, Pause, Film, Clock, ChevronRight, Image as ImageIcon, Video } from "lucide-react";
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

  const PLAYABLE = new Set(["ACTIVE", "PUBLISHED", "APPROVED", "DRAFT"]);
  const PLAYABLE_CAMPAIGN = new Set(["ACTIVE", "APPROVED", "DRAFT"]);

  /* Ad currently playing — find matching ad with its mediaUrl */
  const nowPlayingAd = np
    ? (() => {
        for (const sc of data.campaigns) {
          const ad = sc.campaign.ads.find((a) => a.id === np.adId);
          if (ad) return ad;
        }
        return null;
      })()
    : null;

  /* Next up — first ad from the highest-priority campaign that isn't currently playing */
  const nextAd = (() => {
    for (const sc of data.campaigns) {
      if (!sc.isActive || !PLAYABLE_CAMPAIGN.has(sc.campaign.status)) continue;
      const ad = sc.campaign.ads.find(
        (a) => PLAYABLE.has(a.status) && (!np || a.id !== np.adId) && !!a.mediaUrl,
      );
      if (ad) return { title: ad.title, campaignName: sc.campaign.name, duration: ad.duration, mediaUrl: ad.mediaUrl };
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
            <div className="relative overflow-hidden rounded-xl border border-[#B8EB23]/15 bg-[#080808]">
              {/* Scan line animation */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B8EB23]/40 to-transparent animate-[scan_3s_linear_infinite] z-10" />

              {/* Media preview */}
              {nowPlayingAd?.mediaUrl ? (
                <div className="relative w-full aspect-video overflow-hidden">
                  {nowPlayingAd.format === "VIDEO" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <video
                        src={nowPlayingAd.mediaUrl}
                        className="w-full h-full object-cover opacity-70"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                          <Video className="w-4 h-4 text-white/70" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={nowPlayingAd.mediaUrl}
                      alt={np.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Overlay with info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#B8EB23]/70 mb-0.5">
                          {np.source === "schedule" ? "Programado" : "Campaña"} · En curso
                        </p>
                        <p className="text-sm font-bold text-white truncate">{np.title}</p>
                        <p className="text-[11px] text-white/50 truncate">{np.campaignName}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-mono text-white/60">{np.duration}s</p>
                        <StatusBadge status="ACTIVE" size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-br from-[#B8EB23]/[0.08] via-white/[0.02] to-transparent">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#B8EB23]/10 flex items-center justify-center flex-shrink-0">
                      <Film className="w-4 h-4 text-[#B8EB23]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#B8EB23]/60">
                        {np.source === "schedule" ? "Programado" : "Campaña"} · En curso
                      </span>
                      <p className="text-sm font-bold text-white truncate">{np.title}</p>
                      <p className="text-[11px] text-white/45 mt-0.5 truncate">{np.campaignName}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-mono text-white/50">{np.duration}s</p>
                      <StatusBadge status="ACTIVE" size="sm" />
                    </div>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              <div className="h-1 bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{ width: "60%", background: "linear-gradient(to right, #B8EB23, #D4F564)" }}
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
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
            {nextAd.mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={nextAd.mediaUrl}
                alt={nextAd.title}
                className="w-12 h-8 object-cover rounded-md flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-8 rounded-md bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-3 h-3 text-white/20" />
              </div>
            )}
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
