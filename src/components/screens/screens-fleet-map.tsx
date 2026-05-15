"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minus, Plus, Radio, Wifi } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import {
  COLOMBIA_OUTLINE,
  CITY_LABELS,
  MAP_VIEWBOX,
  buildGraticule,
  projectGeo,
  resolveScreenCoords,
} from "@/lib/colombia-geo";
import type { ScreenStatus } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Fleet map — interactive SVG of Colombia with one pin per screen.
 *
 *   • Background: dark gradient + faint lat/lng graticule + outline
 *   • Pins: color encodes status; ONLINE pulses; click → onSelect
 *   • Hover: floating tooltip near the cursor
 *   • Overlay UI: live counter (top-left) + status legend (top-right)
 *   • Zoom: 0.7×–2× via the corner controls; pan disabled (kept simple)
 *
 * Future-ready: pins are keyed by id and rebuilt from props on each
 * render, so a websocket-driven status update only needs to push a
 * fresh `screens` array to refresh the map in real time.
 * ────────────────────────────────────────────────────────────────────── */

export interface FleetScreen {
  id: string;
  name: string;
  code: string;
  city: string;
  status: ScreenStatus;
  type: string;
  dailyTraffic: number;
  latitude?: number | null;
  longitude?: number | null;
  lastPingAt?: string | null;
}

const STATUS_FILL: Record<ScreenStatus, string> = {
  ONLINE: "#B8EB23",
  OFFLINE: "#F87171",
  MAINTENANCE: "#FB923C",
  RESERVED: "#60A5FA",
};

const STATUS_LABEL: Record<ScreenStatus, string> = {
  ONLINE: "En línea",
  OFFLINE: "Sin conexión",
  MAINTENANCE: "Mantenimiento",
  RESERVED: "Reservada",
};

interface Props {
  screens: FleetScreen[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

type Hover = { id: string; x: number; y: number; svgX: number; svgY: number } | null;

export function ScreensFleetMap({ screens, selectedId, onSelect }: Props) {
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<Hover>(null);
  const [statusFilter, setStatusFilter] = useState<ScreenStatus | "ALL">("ALL");

  const grid = useMemo(() => buildGraticule(2), []);

  /** Cluster collisions: bucket pins by integer SVG coords so multiple
   *  screens at the same city aren't perfectly stacked. We fan them out
   *  in a small ring instead. */
  const placedPins = useMemo(() => {
    const buckets = new Map<string, FleetScreen[]>();
    for (const s of screens) {
      const c = resolveScreenCoords(s);
      if (!c) continue;
      const p = projectGeo(c.lat, c.lng);
      const key = `${Math.round(p.x)}:${Math.round(p.y)}`;
      const arr = buckets.get(key) ?? [];
      arr.push(s);
      buckets.set(key, arr);
    }

    const out: Array<{ screen: FleetScreen; x: number; y: number }> = [];
    for (const arr of buckets.values()) {
      const c = resolveScreenCoords(arr[0]!)!;
      const base = projectGeo(c.lat, c.lng);
      arr.forEach((screen, i) => {
        if (arr.length === 1) {
          out.push({ screen, x: base.x, y: base.y });
        } else {
          const angle = (i / arr.length) * Math.PI * 2;
          const r = 9 + arr.length * 0.6;
          out.push({
            screen,
            x: base.x + Math.cos(angle) * r,
            y: base.y + Math.sin(angle) * r,
          });
        }
      });
    }
    return out;
  }, [screens]);

  const visiblePins = placedPins.filter(
    (p) => statusFilter === "ALL" || p.screen.status === statusFilter,
  );

  const onlineCount = screens.filter((s) => s.status === "ONLINE").length;
  const hoveredScreen = hover ? screens.find((s) => s.id === hover.id) : null;

  return (
    <div className="relative rounded-2xl bg-[#0A0A0A] border border-white/[0.06] overflow-hidden">
      {/* ───────── header bar ───────── */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#B8EB23]/10 border border-[#B8EB23]/20 flex items-center justify-center text-[#B8EB23]">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Centro de operaciones DOOH</h3>
            <p className="text-[11px] text-white/40 mt-0.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="relative inline-flex">
                  <span className="absolute inset-0 rounded-full bg-[#B8EB23] opacity-60 animate-ping" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-[#B8EB23]" />
                </span>
                <span className="text-[#B8EB23] font-semibold">{onlineCount}</span>
                <span>de {screens.length} activas</span>
              </span>
              <span className="text-white/20">•</span>
              <span>monitoreo en tiempo real</span>
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5">
          {(["ALL", "ONLINE", "OFFLINE", "MAINTENANCE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border",
                statusFilter === s
                  ? "bg-white/[0.08] border-white/[0.12] text-white"
                  : "bg-transparent border-transparent text-white/40 hover:text-white hover:bg-white/[0.04]",
              )}
            >
              {s === "ALL" ? "Todas" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ───────── map canvas ───────── */}
      <div className="relative h-[480px] sm:h-[560px] lg:h-[640px] overflow-hidden">
        {/* Ambient grid background */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 30%, rgba(184,235,35,0.06), transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* SVG map */}
        <svg
          viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="relative w-full h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)" }}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <radialGradient id="country-fill" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="rgba(184,235,35,0.10)" />
              <stop offset="55%" stopColor="rgba(184,235,35,0.04)" />
              <stop offset="100%" stopColor="rgba(15,15,15,0.0)" />
            </radialGradient>
            <linearGradient id="country-stroke" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(184,235,35,0.55)" />
              <stop offset="100%" stopColor="rgba(184,235,35,0.18)" />
            </linearGradient>
            <filter id="pin-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Faint graticule */}
          <g stroke="rgba(255,255,255,0.04)" strokeWidth="0.5">
            {grid.map((g, i) => (
              <line key={i} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} />
            ))}
          </g>

          {/* Country fill + outline */}
          <g>
            <path
              d={COLOMBIA_OUTLINE}
              fill="url(#country-fill)"
              stroke="url(#country-stroke)"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
            {/* Inner highlight stroke for depth */}
            <path
              d={COLOMBIA_OUTLINE}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={3}
              strokeLinejoin="round"
              transform="translate(0.5 0.5)"
            />
          </g>

          {/* Anchor city labels */}
          <g pointerEvents="none">
            {CITY_LABELS.map((c) => {
              const p = projectGeo(c.lat, c.lng);
              return (
                <g key={c.name} transform={`translate(${p.x}, ${p.y})`}>
                  <circle r={1.6} fill="rgba(255,255,255,0.35)" />
                  <text
                    x={6}
                    y={3.5}
                    fontSize={9}
                    fontFamily="ui-sans-serif, system-ui"
                    fill="rgba(255,255,255,0.32)"
                    fontWeight={500}
                    letterSpacing="0.02em"
                  >
                    {c.name}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Pins */}
          <g>
            {visiblePins.map(({ screen, x, y }) => {
              const fill = STATUS_FILL[screen.status];
              const isOnline = screen.status === "ONLINE";
              const isSelected = selectedId === screen.id;
              const isHovered = hover?.id === screen.id;

              return (
                <g
                  key={screen.id}
                  transform={`translate(${x}, ${y})`}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement | null)?.getBoundingClientRect();
                    setHover({
                      id: screen.id,
                      x: e.clientX - (rect?.left ?? 0),
                      y: e.clientY - (rect?.top ?? 0),
                      svgX: x,
                      svgY: y,
                    });
                  }}
                  onMouseMove={(e) => {
                    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement | null)?.getBoundingClientRect();
                    setHover({
                      id: screen.id,
                      x: e.clientX - (rect?.left ?? 0),
                      y: e.clientY - (rect?.top ?? 0),
                      svgX: x,
                      svgY: y,
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect(screen.id)}
                >
                  {/* Pulse ring (online only) */}
                  {isOnline && (
                    <>
                      <circle r={10} fill="none" stroke={fill} strokeOpacity={0.4} strokeWidth={1}>
                        <animate attributeName="r" from="6" to="14" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" from="0.5" to="0" dur="2.4s" repeatCount="indefinite" />
                      </circle>
                      <circle r={14} fill={fill} fillOpacity={0.1} />
                    </>
                  )}

                  {/* Halo when selected/hovered */}
                  {(isSelected || isHovered) && (
                    <circle r={11} fill={fill} fillOpacity={0.18} stroke={fill} strokeOpacity={0.5} strokeWidth={0.8} />
                  )}

                  {/* Outer ring */}
                  <circle r={5.5} fill="rgba(0,0,0,0.6)" stroke={fill} strokeWidth={1.2} />
                  {/* Core dot */}
                  <circle r={3} fill={fill} filter={isOnline ? "url(#pin-glow)" : undefined} />
                </g>
              );
            })}
          </g>
        </svg>

        {/* ───────── overlay: legend ───────── */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#0F0F0F]/85 backdrop-blur-sm border border-white/[0.08]">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/35 px-1.5 mb-0.5">
            Estado
          </p>
          {(["ONLINE", "OFFLINE", "MAINTENANCE", "RESERVED"] as const).map((s) => (
            <div key={s} className="flex items-center gap-2 px-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: STATUS_FILL[s] }}
              />
              <span className="text-[10px] text-white/60 font-medium">{STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>

        {/* ───────── overlay: zoom controls ───────── */}
        <div className="absolute bottom-4 right-4 flex flex-col rounded-xl bg-[#0F0F0F]/85 backdrop-blur-sm border border-white/[0.08] overflow-hidden">
          <button
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(2)))}
            className="p-2 text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
            aria-label="Acercar"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="h-px bg-white/[0.06]" />
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1.5 text-[10px] font-mono text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors tabular-nums"
            aria-label="Restablecer zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <div className="h-px bg-white/[0.06]" />
          <button
            onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.2).toFixed(2)))}
            className="p-2 text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
            aria-label="Alejar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ───────── overlay: live status pill ───────── */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0F0F0F]/85 backdrop-blur-sm border border-white/[0.08]">
          <Wifi className="w-3.5 h-3.5 text-[#B8EB23]" />
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-white/40">Telemetría</span>
            <span className="text-[#B8EB23] font-semibold tabular-nums">
              {formatNumber(visiblePins.length)} pins
            </span>
            <span className="text-white/20">•</span>
            <span className="text-white/40">actualizado en vivo</span>
          </div>
        </div>

        {/* ───────── floating tooltip ───────── */}
        <AnimatePresence>
          {hover && hoveredScreen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="absolute pointer-events-none z-20 min-w-[200px]"
              style={{
                left: Math.min(hover.x + 14, 9999),
                top: Math.max(hover.y - 70, 8),
              }}
            >
              <div className="rounded-xl bg-[#0F0F0F]/95 backdrop-blur-md border border-white/[0.1] shadow-2xl shadow-black/50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STATUS_FILL[hoveredScreen.status] }}
                  />
                  <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/40">
                    {hoveredScreen.code}
                  </span>
                </div>
                <p className="text-xs font-bold text-white leading-tight truncate max-w-[220px]">
                  {hoveredScreen.name}
                </p>
                <p className="text-[10px] text-white/45 mt-0.5">
                  {hoveredScreen.city} · {STATUS_LABEL[hoveredScreen.status]}
                </p>
                <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">Tráfico</span>
                  <span className="text-[10px] font-semibold text-[#B8EB23] tabular-nums">
                    {formatNumber(hoveredScreen.dailyTraffic, true)} /día
                  </span>
                </div>
                <p className="text-[9px] text-white/25 mt-1.5 italic">Click para ver detalles</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───────── empty map state ───────── */}
        {placedPins.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-[#B8EB23]/10 blur-2xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-[#0F0F0F] border border-white/[0.08] flex items-center justify-center">
                <Maximize2 className="w-5 h-5 text-white/40" />
              </div>
            </div>
            <p className="text-sm font-semibold text-white mt-4">Mapa de flota vacío</p>
            <p className="text-xs text-white/40 mt-1 max-w-xs text-center">
              Cuando registres pantallas con geolocalización aparecerán aquí en tiempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
