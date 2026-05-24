"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import type { PlayerScreen, PlaylistItem } from "@/services/player.service";

const HEARTBEAT_MS     = 15_000;
const PLAYLIST_POLL_MS = 30_000;

interface Props {
  playerKey:       string;
  screen:          PlayerScreen;
  initialPlaylist: PlaylistItem[];
}

/* ── Standby ───────────────────────────────────────────────────────── */
function Standby({ name }: { name: string }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 select-none">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-[#B8EB23]/30 blur-2xl" />
        <div className="relative w-20 h-20 rounded-2xl bg-[#0A0A0A] border border-[#B8EB23]/30 flex items-center justify-center shadow-[0_0_40px_rgba(184,235,35,0.15)]">
          <Zap className="w-9 h-9 text-[#B8EB23]" strokeWidth={2} />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-[#B8EB23]/70">BelaBlaze · DOOH</p>
        <p className="text-xl font-semibold text-white/80 tracking-wide">{name}</p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#B8EB23] animate-pulse" />
        <span className="text-xs text-white/50 font-medium tracking-wide">Sin contenido programado</span>
      </div>
      <p suppressHydrationWarning className="text-3xl font-mono text-white/20 tabular-nums mt-4">{time}</p>
    </div>
  );
}

/* ── Main player ───────────────────────────────────────────────────── */
export function DoohPlayer({ playerKey, screen, initialPlaylist }: Props) {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(initialPlaylist);
  const [index, setIndex]       = useState(0);

  // Keep refs so timers always read latest values without re-registering
  const playlistRef = useRef(playlist);
  const indexRef    = useRef(index);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { indexRef.current    = index;    }, [index]);

  /* ── Advance to next item ── */
  function advance() {
    const pl = playlistRef.current;
    if (pl.length === 0) return;
    setIndex((prev) => (prev + 1) % pl.length);
  }

  /* ── Schedule advance for images ── */
  useEffect(() => {
    const item = playlist[index];
    if (!item || item.format === "VIDEO") return; // videos call advance via onEnded

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(advance, item.duration * 1000);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playlist]);

  /* ── Heartbeat ── */
  useEffect(() => {
    const ping = () => {
      fetch("/api/player/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerKey, currentAdId: playlistRef.current[indexRef.current]?.adId }),
      }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [playerKey]);

  /* ── Playlist refresh every 30 s ── */
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/player/playlist/${playerKey}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json() as { playlist: PlaylistItem[] };
      if (!Array.isArray(data.playlist)) return;

      // Actualizar solo si cambió el contenido
      const newIds = data.playlist.map((p) => p.adId).join(",");
      const currentIds = playlist.map((p) => p.adId).join(",");
      if (newIds === currentIds) return; // sin cambios, no re-renderizar

      setPlaylist(data.playlist);
      // No resetear índice si el ad actual sigue en la nueva playlist
      setIndex((prev) => {
        const stillExists = data.playlist[prev] !== undefined;
        return stillExists ? prev : 0;
      });
    } catch {
      // silenciar errores de red
    }
  }, [playerKey, playlist]);

  useEffect(() => {
    refresh(); // poll inmediato al montar
    const id = setInterval(refresh, PLAYLIST_POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  /* ── Hide cursor ── */
  useEffect(() => {
    document.body.style.cursor = "none";
    return () => { document.body.style.cursor = ""; };
  }, []);

  const item = playlist[index] ?? null;

  /* ── Reset index when playlist changes and current index is invalid ── */
  useEffect(() => {
    if (index >= playlist.length && playlist.length > 0) setIndex(0);
  }, [playlist, index]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden" style={{ cursor: "none" }}>
      {playlist.length === 0 || !item ? (
        <Standby name={screen.name} />
      ) : item.format === "VIDEO" ? (
        <video
          key={item.adId}
          src={item.url}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          onEnded={advance}
          onError={advance}
        />
      ) : (
        <img
          key={item.adId}
          src={item.url}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          onError={advance}
        />
      )}

      {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-white/20 select-none pointer-events-none text-right leading-relaxed">
          <div>{screen.name}</div>
          <div>{playlist.length} ad{playlist.length !== 1 ? "s" : ""} · #{index + 1}</div>
          <div>{item?.format ?? "—"} · {item?.duration ?? 0}s</div>
        </div>
      )}
    </div>
  );
}
