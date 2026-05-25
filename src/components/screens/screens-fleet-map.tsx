"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScreenStatus } from "@/types";
import type { DOOHScreen } from "./dooh-network-map";

/* ──────────────────────────────────────────────────────────────────────
 * Fleet map shell — header + filter tabs + Mapbox canvas.
 *
 * DOOHNetworkMap is loaded client-side only (mapbox-gl uses browser
 * APIs that fail during SSR). The dynamic wrapper renders a dark
 * skeleton until the bundle loads.
 * ────────────────────────────────────────────────────────────────────── */

// Dynamically imported to prevent mapbox-gl from running during SSR.
const DOOHNetworkMap = dynamic(
  () => import("./dooh-network-map").then((m) => ({ default: m.DOOHNetworkMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#B8EB23]/20 border-t-[#B8EB23] animate-spin" />
      </div>
    ),
  },
);

export type FleetScreen = DOOHScreen;

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
  lastRefreshed?: number;
}

export function ScreensFleetMap({ screens, selectedId, onSelect, lastRefreshed }: Props) {
  const [statusFilter, setStatusFilter] = useState<ScreenStatus | "ALL">("ALL");
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Reset counter and tick every second when lastRefreshed changes.
  useEffect(() => {
    setSecondsAgo(0);
    const id = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [lastRefreshed]);

  const onlineCount = useMemo(
    () => screens.filter((s) => s.status === "ONLINE").length,
    [screens],
  );

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
              <span className="tabular-nums">
                actualizado hace {secondsAgo}s
              </span>
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
      <div className="relative h-[480px] sm:h-[560px] lg:h-[640px]">
        <DOOHNetworkMap
          screens={screens}
          selectedId={selectedId}
          onSelect={onSelect}
          statusFilter={statusFilter}
        />
      </div>
    </div>
  );
}
