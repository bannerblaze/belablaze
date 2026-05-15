"use client";

import { motion } from "framer-motion";
import {
  Activity, Wifi, WifiOff, Wrench, Users, Gauge,
} from "lucide-react";
import { cn, formatNumber, formatPercent } from "@/lib/utils";
import { staggerChild } from "@/lib/motion";

/* ──────────────────────────────────────────────────────────────────────
 * Fleet overview — the dense, premium metric strip above the map.
 *
 * Six tiles, custom-built (not generic <MetricCard>) so we can:
 *   • run a thin colored accent strip for status semantics
 *   • show a live pulse on the "online" tile
 *   • cap the visual weight so the map below stays the hero
 *
 * Inputs are precomputed counts — keeps this purely presentational.
 * ────────────────────────────────────────────────────────────────────── */

export interface FleetOverviewMetrics {
  total: number;
  online: number;
  offline: number;
  maintenance: number;
  cities: number;
  dailyTraffic: number;
  uptimePercent: number; // 0–100
}

interface TileProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  accent: "brand" | "red" | "orange" | "blue" | "neutral";
  pulse?: boolean;
  index: number;
}

const ACCENT: Record<TileProps["accent"], { bar: string; iconBg: string; iconText: string; ring: string; glow: string }> = {
  brand:   { bar: "bg-[#B8EB23]",  iconBg: "bg-[#B8EB23]/10",  iconText: "text-[#B8EB23]",  ring: "hover:border-[#B8EB23]/35", glow: "shadow-[inset_0_0_30px_rgba(184,235,35,0.05)]" },
  red:     { bar: "bg-red-400",    iconBg: "bg-red-400/10",    iconText: "text-red-400",    ring: "hover:border-red-400/30",   glow: "" },
  orange:  { bar: "bg-orange-400", iconBg: "bg-orange-400/10", iconText: "text-orange-400", ring: "hover:border-orange-400/30",glow: "" },
  blue:    { bar: "bg-blue-400",   iconBg: "bg-blue-400/10",   iconText: "text-blue-400",   ring: "hover:border-blue-400/30",  glow: "" },
  neutral: { bar: "bg-white/30",   iconBg: "bg-white/[0.06]",  iconText: "text-white/60",   ring: "hover:border-white/15",     glow: "" },
};

function Tile({ label, value, sublabel, icon, accent, pulse, index }: TileProps) {
  const a = ACCENT[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={staggerChild(index)}
      className={cn(
        "relative rounded-xl bg-[#0F0F0F] border border-white/[0.06] overflow-hidden transition-colors duration-200",
        a.ring,
        a.glow,
      )}
    >
      {/* Top accent strip */}
      <div className={cn("h-[2px] w-full opacity-80", a.bar)} />

      <div className="p-3.5 lg:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", a.iconBg, a.iconText)}>
            {icon}
          </div>
          {pulse && (
            <span className="relative inline-flex flex-shrink-0 mt-1.5">
              <span className="absolute inset-0 rounded-full bg-[#B8EB23] opacity-60 animate-ping" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-[#B8EB23]" />
            </span>
          )}
        </div>

        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35 leading-none">
            {label}
          </p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl lg:text-[22px] font-bold text-white tracking-tight tabular-nums leading-none">
              {value}
            </span>
            {sublabel && (
              <span className="text-[11px] text-white/30 font-medium">{sublabel}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface Props {
  metrics: FleetOverviewMetrics;
}

export function ScreensOverview({ metrics }: Props) {
  const { total, online, offline, maintenance, cities, dailyTraffic, uptimePercent } = metrics;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 lg:gap-3">
      <Tile
        label="Pantallas"
        value={formatNumber(total)}
        sublabel="totales"
        icon={<Activity className="w-4 h-4" />}
        accent="neutral"
        index={0}
      />
      <Tile
        label="En línea"
        value={formatNumber(online)}
        sublabel={total ? `de ${total}` : undefined}
        icon={<Wifi className="w-4 h-4" />}
        accent="brand"
        pulse={online > 0}
        index={1}
      />
      <Tile
        label="Sin conexión"
        value={formatNumber(offline)}
        icon={<WifiOff className="w-4 h-4" />}
        accent="red"
        index={2}
      />
      <Tile
        label="Mantenimiento"
        value={formatNumber(maintenance)}
        icon={<Wrench className="w-4 h-4" />}
        accent="orange"
        index={3}
      />
      <Tile
        label="Tráfico diario"
        value={formatNumber(dailyTraffic, true)}
        sublabel="impactos"
        icon={<Users className="w-4 h-4" />}
        accent="blue"
        index={4}
      />
      <Tile
        label="Uptime"
        value={formatPercent(uptimePercent, 1)}
        sublabel={`${cities} ${cities === 1 ? "ciudad" : "ciudades"}`}
        icon={<Gauge className="w-4 h-4" />}
        accent="brand"
        index={5}
      />
    </div>
  );
}

export function deriveFleetMetrics(screens: Array<{ status: string; city: string; dailyTraffic: number }>): FleetOverviewMetrics {
  const total = screens.length;
  const online = screens.filter((s) => s.status === "ONLINE").length;
  const offline = screens.filter((s) => s.status === "OFFLINE").length;
  const maintenance = screens.filter((s) => s.status === "MAINTENANCE").length;
  const cities = new Set(screens.map((s) => s.city)).size;
  const dailyTraffic = screens.reduce((sum, s) => sum + (s.dailyTraffic || 0), 0);
  const uptimePercent = total > 0 ? (online / total) * 100 : 0;
  return { total, online, offline, maintenance, cities, dailyTraffic, uptimePercent };
}

