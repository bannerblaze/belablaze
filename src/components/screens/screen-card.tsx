"use client";

import { motion } from "framer-motion";
import { MapPin, Users, Maximize2, Activity, ChevronRight, Ruler } from "lucide-react";
import { ScreenStatusBadge, ScreenStatusDot } from "./screen-status-badge";
import { cn, formatNumber, formatRelativeTime, getScreenTypeLabel } from "@/lib/utils";
import { staggerChild } from "@/lib/motion";
import type { ScreenStatus } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Premium fleet card.
 *
 *   • Top accent strip encodes status
 *   • Live preview tile (orientation-aware aspect ratio + scan animation
 *     when ONLINE — keeps the card feeling like a device, not a row)
 *   • Compact metric grid (city / type / traffic / dimensions)
 *   • Footer with status + last ping + chevron affordance
 *
 * Click anywhere → onSelect(id). Keyboard accessible via tabIndex/role.
 * ────────────────────────────────────────────────────────────────────── */

export interface CardScreen {
  id: string;
  name: string;
  code: string;
  type: string;
  status: ScreenStatus;
  city: string;
  width: number;
  height: number;
  resolutionWidth: number;
  resolutionHeight: number;
  dailyTraffic: number;
  orientation: string;
  lastPingAt?: string | null;
}

interface Props {
  screen: CardScreen;
  index: number;
  selected?: boolean;
  onSelect: (id: string) => void;
}

const ACCENT: Record<ScreenStatus, { bar: string; ringHover: string; bg: string }> = {
  ONLINE:      { bar: "bg-[#B8EB23]",  ringHover: "hover:border-[#B8EB23]/35",  bg: "hover:bg-[#0F1208]" },
  OFFLINE:     { bar: "bg-red-400/80", ringHover: "hover:border-red-400/25",    bg: "hover:bg-[#120909]" },
  MAINTENANCE: { bar: "bg-orange-400", ringHover: "hover:border-orange-400/25", bg: "hover:bg-[#120D08]" },
  RESERVED:    { bar: "bg-blue-400",   ringHover: "hover:border-blue-400/25",   bg: "hover:bg-[#080D14]" },
};

export function ScreenCard({ screen, index, selected, onSelect }: Props) {
  const isOnline = screen.status === "ONLINE";
  const a = ACCENT[screen.status] ?? ACCENT.OFFLINE;
  const aspect = screen.orientation === "portrait" ? "aspect-[3/4]" : "aspect-[16/9]";
  const displayName = screen.name.split("—")[0]?.trim() ?? screen.name;
  const subName = screen.name.includes("—") ? screen.name.split("—")[1]?.trim() : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={staggerChild(index)}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(screen.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(screen.id);
        }
      }}
      className={cn(
        "group relative rounded-xl bg-[#0F0F0F] border overflow-hidden cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B8EB23]/40",
        selected
          ? "border-[#B8EB23]/40 bg-[#0F1208] shadow-[0_0_0_1px_rgba(184,235,35,0.2)]"
          : "border-white/[0.06]",
        a.ringHover,
        a.bg,
      )}
    >
      {/* Status accent strip */}
      <div className={cn("h-[2px] w-full", a.bar)} />

      <div className="p-4 space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <ScreenStatusDot status={screen.status} />
              <span className="text-[9px] font-bold font-mono uppercase tracking-[0.1em] text-white/35">
                {screen.code}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white leading-tight truncate group-hover:text-[#B8EB23] transition-colors">
              {displayName}
            </h3>
            {subName && (
              <p className="text-[11px] text-white/40 mt-0.5 truncate">{subName}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
        </div>

        {/* Live preview tile */}
        <div
          className={cn(
            "relative rounded-lg overflow-hidden border border-white/[0.06] bg-[#080808]",
            aspect,
          )}
        >
          {isOnline ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[#B8EB23]/12 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="relative inline-flex">
                    <span className="absolute inset-0 rounded-full bg-[#B8EB23] opacity-50 animate-ping" />
                    <span className="relative w-1.5 h-1.5 rounded-full bg-[#B8EB23]" />
                  </span>
                  <span className="text-[9px] font-mono text-white/40 tracking-wider">
                    {screen.resolutionWidth}×{screen.resolutionHeight}
                  </span>
                </div>
              </div>
              {/* moving scan line */}
              <motion.div
                initial={{ y: "-100%" }}
                animate={{ y: "100%" }}
                transition={{ duration: 4 + index * 0.3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-6 bg-gradient-to-b from-transparent via-[#B8EB23]/8 to-transparent pointer-events-none"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <div
                className="w-8 h-8 rounded-full opacity-30"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0 2px, transparent 2px 6px)",
                }}
              />
              <span className="text-[9px] text-white/25 uppercase tracking-wider">Sin señal</span>
            </div>
          )}

          {/* corner badges inside tile */}
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/45 backdrop-blur-sm text-[9px] font-mono text-white/55 capitalize">
            {screen.orientation === "portrait" ? "P" : "L"}
          </div>
          <div className="absolute bottom-1.5 right-1.5">
            <ScreenStatusBadge status={screen.status} size="xs" />
          </div>
        </div>

        {/* Metric grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-white/55 min-w-0">
            <MapPin className="w-3 h-3 text-white/30 flex-shrink-0" />
            <span className="truncate">{screen.city}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/55 min-w-0">
            <Activity className="w-3 h-3 text-white/30 flex-shrink-0" />
            <span className="truncate">{getScreenTypeLabel(screen.type)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/55 min-w-0">
            <Users className="w-3 h-3 text-white/30 flex-shrink-0" />
            <span className="truncate tabular-nums">
              {formatNumber(screen.dailyTraffic, true)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/55 min-w-0">
            <Ruler className="w-3 h-3 text-white/30 flex-shrink-0" />
            <span className="truncate tabular-nums">
              {screen.width}×{screen.height}m
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.05]">
          <span className="text-[10px] text-white/35 inline-flex items-center gap-1">
            <Maximize2 className="w-2.5 h-2.5" />
            <span className="font-mono tabular-nums">
              {screen.resolutionWidth}×{screen.resolutionHeight}
            </span>
          </span>
          {screen.lastPingAt && (
            <span className="text-[10px] text-white/35">
              {isOnline ? (
                <span className="text-[#B8EB23]/80 font-medium">Activa ahora</span>
              ) : (
                <>Vista {formatRelativeTime(screen.lastPingAt)}</>
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** Compact list-row variant (for the inventory list view). */
export function ScreenRow({ screen, index, selected, onSelect }: Props) {
  const displayName = screen.name.split("—")[0]?.trim() ?? screen.name;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(screen.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(screen.id);
        }
      }}
      className={cn(
        "group grid grid-cols-12 items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B8EB23]/40",
        selected
          ? "bg-[#0F1208] border-[#B8EB23]/30"
          : "bg-[#0F0F0F] border-white/[0.05] hover:bg-[#131313] hover:border-white/[0.1]",
      )}
    >
      <div className="col-span-4 flex items-center gap-2.5 min-w-0">
        <ScreenStatusDot status={screen.status} className="flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate group-hover:text-[#B8EB23] transition-colors">
            {displayName}
          </p>
          <p className="text-[10px] font-mono text-white/35 mt-0.5">{screen.code}</p>
        </div>
      </div>
      <div className="col-span-2 text-xs text-white/55 truncate">{screen.city}</div>
      <div className="col-span-2 text-xs text-white/45 truncate">{getScreenTypeLabel(screen.type)}</div>
      <div className="col-span-1 text-xs text-white/55 tabular-nums">
        {screen.width}×{screen.height}m
      </div>
      <div className="col-span-1 text-xs text-white tabular-nums font-semibold">
        {formatNumber(screen.dailyTraffic, true)}
      </div>
      <div className="col-span-2 flex items-center justify-end gap-2">
        <ScreenStatusBadge status={screen.status} size="xs" />
        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
      </div>
    </motion.div>
  );
}
