"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Zap } from "lucide-react";
import type { PlayerScreen, PlaylistItem } from "@/services/player.service";

/* ──────────────────────────────────────────────────────────────────────
 * DoohPlayer — production DOOH playback engine.
 *
 * Responsibilities:
 *   • Loop through the playlist with fade transitions
 *   • Heartbeat (POST /api/player/ping) every 15 s
 *   • Playlist refresh (GET /api/player/playlist/…) every 30 s
 *   • Hide cursor, lock viewport, prevent sleep when possible
 *   • Graceful standby when playlist is empty
 *
 * Media flow:
 *   IMAGE → show for ad.duration seconds, then advance
 *   VIDEO → play once (onEnded), fall back to ad.duration on error
 *
 * State machine: idle → fadingOut → fadingIn → idle
 * ────────────────────────────────────────────────────────────────────── */

const FADE_MS          = 600;   // cross-fade duration
const HEARTBEAT_MS     = 15_000;
const PLAYLIST_POLL_MS = 30_000;

interface Props {
  playerKey: string;
  screen: PlayerScreen;
  initialPlaylist: PlaylistItem[];
}

/* ── Standby screen ────────────────────────────────────────────────── */
function StandbyScreen({ screenName }: { screenName: string }) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 select-none">
      {/* Logo */}
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-[#B8EB23]/30 blur-2xl" />
        <div className="relative w-20 h-20 rounded-2xl bg-[#0A0A0A] border border-[#B8EB23]/30 flex items-center justify-center shadow-[0_0_40px_rgba(184,235,35,0.15)]">
          <Zap className="w-9 h-9 text-[#B8EB23]" strokeWidth={2} />
        </div>
      </div>

      {/* Brand */}
      <div className="text-center space-y-1">
        <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-[#B8EB23]/70">
          BelaBlaze · DOOH
        </p>
        <p className="text-xl font-semibold text-white/80 tracking-wide">{screenName}</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#B8EB23] animate-pulse" />
        <span className="text-xs text-white/50 font-medium tracking-wide">Sin contenido programado</span>
      </div>

      {/* Clock */}
      <p suppressHydrationWarning className="text-3xl font-mono text-white/20 tabular-nums mt-4">
        {time}
      </p>
    </div>
  );
}

/* ── Media renderer ────────────────────────────────────────────────── */
interface MediaProps {
  item: PlaylistItem;
  onEnded: () => void;
  onError: () => void;
}

function MediaRenderer({ item, onEnded, onError }: MediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (item.format === "VIDEO" && videoRef.current) {
      const vid = videoRef.current;
      vid.play().catch(onError);
    }
  }, [item.url, item.format, onError]);

  if (item.format === "VIDEO") {
    return (
      <video
        ref={videoRef}
        key={item.url}
        src={item.url}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        autoPlay
        preload="auto"
        onEnded={onEnded}
        onError={onError}
      />
    );
  }

  return (
    <img
      key={item.url}
      src={item.url}
      alt={item.title}
      className="absolute inset-0 w-full h-full object-cover"
      draggable={false}
      onError={onError}
    />
  );
}

/* ── Main player ───────────────────────────────────────────────────── */
export function DoohPlayer({ playerKey, screen, initialPlaylist }: Props) {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(initialPlaylist);
  const [index, setIndex]       = useState(0);
  const [opacity, setOpacity]   = useState(1);
  const [fading, setFading]     = useState(false);

  const playlistRef  = useRef(playlist);
  const indexRef     = useRef(index);
  const currentAdRef = useRef<string | undefined>(playlist[0]?.adId);
  const imageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { indexRef.current = index; }, [index]);

  const currentItem = playlist[index] ?? null;

  /* Advance to next item with fade */
  const advance = useCallback(() => {
    if (fading) return;
    setFading(true);
    setOpacity(0);

    setTimeout(() => {
      const next = playlistRef.current;
      if (next.length === 0) {
        setFading(false);
        setOpacity(1);
        return;
      }
      const nextIdx = (indexRef.current + 1) % next.length;
      setIndex(nextIdx);
      currentAdRef.current = next[nextIdx]?.adId;
      setOpacity(1);
      setFading(false);
    }, FADE_MS);
  }, [fading]);

  /* Image duration timer */
  useEffect(() => {
    if (!currentItem || currentItem.format === "VIDEO") return;
    if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    imageTimerRef.current = setTimeout(advance, currentItem.duration * 1000);
    return () => {
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, [currentItem, advance]);

  /* Heartbeat — every 15 s */
  useEffect(() => {
    const ping = () => {
      fetch("/api/player/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerKey,
          currentAdId: currentAdRef.current,
          uptime:      Math.floor((Date.now() - startTimeRef.current) / 1000),
          resolution:  { width: window.innerWidth, height: window.innerHeight },
        }),
      }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [playerKey]);

  /* Playlist refresh — every 30 s */
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch(`/api/player/playlist/${playerKey}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { playlist: PlaylistItem[] };
        if (Array.isArray(data.playlist)) {
          setPlaylist(data.playlist);
          // If current index is out of bounds, reset to 0
          if (indexRef.current >= data.playlist.length) {
            setIndex(0);
          }
        }
      } catch {
        // Network error — keep current playlist
      }
    };
    const id = setInterval(refresh, PLAYLIST_POLL_MS);
    return () => clearInterval(id);
  }, [playerKey]);

  /* Hide cursor + prevent right-click + wake lock */
  useEffect(() => {
    document.body.style.cursor = "none";
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", prevent);

    // Wake Lock API — keeps screen on
    let wakeLock: WakeLockSentinel | null = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request("screen");
        }
      } catch { /* not supported */ }
    };
    requestWakeLock();

    return () => {
      document.body.style.cursor = "";
      document.removeEventListener("contextmenu", prevent);
      wakeLock?.release().catch(() => {});
    };
  }, []);

  const isEmpty = playlist.length === 0;

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ cursor: "none" }}
    >
      {/* Media layer */}
      <div
        className="absolute inset-0"
        style={{
          opacity,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
          willChange: "opacity",
        }}
      >
        {isEmpty ? (
          <StandbyScreen screenName={screen.name} />
        ) : currentItem ? (
          <MediaRenderer
            key={`${currentItem.adId}-${index}`}
            item={currentItem}
            onEnded={advance}
            onError={advance}
          />
        ) : null}
      </div>

      {/* Invisible debug overlay (dev only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-white/20 select-none pointer-events-none text-right leading-relaxed">
          <div>{screen.name}</div>
          <div>{playlist.length} ad{playlist.length !== 1 ? "s" : ""} · #{index + 1}</div>
        </div>
      )}
    </div>
  );
}
