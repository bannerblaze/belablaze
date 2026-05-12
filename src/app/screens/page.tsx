"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MonitorPlay, Wifi, WifiOff, Wrench, Lock,
  MapPin, Users, Zap, Activity, LayoutGrid,
  List, Search, X, Plus, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { mockScreens } from "@/lib/mock-data";
import { formatNumber, getScreenTypeLabel, formatRelativeTime, cn } from "@/lib/utils";
import type { Screen, ScreenStatus } from "@/types";

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "ONLINE", label: "En línea" },
  { value: "OFFLINE", label: "Sin conexión" },
  { value: "MAINTENANCE", label: "Mantenimiento" },
  { value: "RESERVED", label: "Reservadas" },
];

const STATUS_ICON: Record<ScreenStatus, React.ReactNode> = {
  ONLINE: <Wifi className="w-4 h-4 text-green-400" />,
  OFFLINE: <WifiOff className="w-4 h-4 text-red-400" />,
  MAINTENANCE: <Wrench className="w-4 h-4 text-orange-400" />,
  RESERVED: <Lock className="w-4 h-4 text-blue-400" />,
};

function ScreenCard({ screen, index }: { screen: Screen; index: number }) {
  const isOnline = screen.status === "ONLINE";
  const isOffline = screen.status === "OFFLINE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={cn(
        "group rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
        isOnline
          ? "bg-[#111111] border-white/[0.06] hover:border-[#B8EB23]/30 hover:bg-[#131313]"
          : isOffline
          ? "bg-[#111111] border-red-500/10 hover:border-red-500/20"
          : "bg-[#111111] border-white/[0.06] hover:border-white/10"
      )}
    >
      {/* Top bar: status color */}
      <div className={cn(
        "h-1 w-full",
        isOnline ? "bg-[#B8EB23]" :
        isOffline ? "bg-red-500" :
        screen.status === "MAINTENANCE" ? "bg-orange-400" : "bg-blue-400"
      )} />

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white leading-tight group-hover:text-[#B8EB23] transition-colors">
              {screen.name.split("—")[0].trim()}
            </h3>
            <p className="text-xs text-white/40 mt-0.5 leading-none">
              {screen.name.includes("—") ? screen.name.split("—")[1].trim() : ""}
            </p>
          </div>
          <div className="flex-shrink-0">
            {STATUS_ICON[screen.status]}
          </div>
        </div>

        {/* Screen preview mockup */}
        <div className={cn(
          "relative rounded-lg overflow-hidden flex items-center justify-center",
          screen.orientation === "portrait" ? "h-24" : "h-16",
          "bg-[#0A0A0A] border border-white/[0.08]"
        )}>
          {isOnline ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-[#B8EB23]/5 via-transparent to-transparent" />
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#B8EB23] animate-pulse" />
                <span className="text-[10px] text-white/40 font-mono">{screen.resolutionWidth}×{screen.resolutionHeight}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <WifiOff className="w-5 h-5 text-white/15" />
              <span className="text-[10px] text-white/20">Sin señal</span>
            </div>
          )}
          {/* Screen code badge */}
          <span className="absolute top-1.5 left-1.5 text-[9px] font-mono text-white/30 bg-black/40 px-1.5 py-0.5 rounded">
            {screen.code}
          </span>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-3">
          <div className="flex items-center gap-1.5 text-[11px] text-white/50">
            <MapPin className="w-3 h-3 flex-shrink-0 text-white/30" />
            <span className="truncate">{screen.city}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/50">
            <MonitorPlay className="w-3 h-3 flex-shrink-0 text-white/30" />
            <span className="truncate">{getScreenTypeLabel(screen.type)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/50">
            <Users className="w-3 h-3 flex-shrink-0 text-white/30" />
            <span>{formatNumber(screen.dailyTraffic, true)}/día</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/50">
            <Zap className="w-3 h-3 flex-shrink-0 text-white/30" />
            <span>{screen.width}×{screen.height}m</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <StatusBadge status={screen.status} size="sm" />
          {screen.lastPingAt && (
            <span className="text-[10px] text-white/25">
              {isOnline ? "Activa ahora" : `Última vez ${formatRelativeTime(screen.lastPingAt)}`}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ScreensPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    let list = [...mockScreens];
    if (search) list = list.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    return list;
  }, [search, statusFilter]);

  const onlineCount = mockScreens.filter((s) => s.status === "ONLINE").length;
  const offlineCount = mockScreens.filter((s) => s.status === "OFFLINE").length;
  const maintenanceCount = mockScreens.filter((s) => s.status === "MAINTENANCE").length;
  const totalTraffic = mockScreens.reduce((s, sc) => s + sc.dailyTraffic, 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Pantallas en línea"
          value={`${onlineCount}/${mockScreens.length}`}
          icon={<Wifi className="w-5 h-5" />}
          highlight
          index={0}
        />
        <MetricCard
          title="Sin conexión"
          value={offlineCount}
          icon={<WifiOff className="w-5 h-5" />}
          index={1}
        />
        <MetricCard
          title="En mantenimiento"
          value={maintenanceCount}
          icon={<Wrench className="w-5 h-5" />}
          index={2}
        />
        <MetricCard
          title="Tráfico diario total"
          value={totalTraffic}
          delta={8.3}
          icon={<Users className="w-5 h-5" />}
          index={3}
        />
      </div>

      {/* Live status bar */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#111111] border border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#B8EB23]">
          <span className="w-2 h-2 rounded-full bg-[#B8EB23] animate-pulse" />
          Estado en tiempo real
        </div>
        <div className="flex items-center gap-4 ml-2">
          {mockScreens.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <div className={cn(
                "w-2 h-2 rounded-full",
                s.status === "ONLINE" ? "bg-green-400 animate-pulse" :
                s.status === "OFFLINE" ? "bg-red-400" :
                s.status === "MAINTENANCE" ? "bg-orange-400" : "bg-blue-400"
              )} />
              <span className="text-[11px] text-white/40 hidden sm:inline">{s.code}</span>
            </div>
          ))}
        </div>
        <button className="ml-auto text-white/30 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar pantalla, ciudad o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#B8EB23]/40 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                statusFilter === tab.value
                  ? "bg-[#B8EB23]/10 text-[#B8EB23] border border-[#B8EB23]/20"
                  : "text-white/40 hover:text-white border border-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setView("grid")}
              className={cn("p-1.5 rounded-md transition-all", view === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white")}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("p-1.5 rounded-md transition-all", view === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white")}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <Button variant="brand" size="sm" icon={<Plus className="w-4 h-4" />}>
            Nueva pantalla
          </Button>
        </div>
      </div>

      {/* Grid */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((screen, i) => (
            <ScreenCard key={screen.id} screen={screen} index={i} />
          ))}
        </div>
      ) : (
        /* List view */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Pantalla", "Código", "Ciudad", "Tipo", "Tráfico/día", "Precio/seg", "Estado", "Último ping"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((screen, i) => (
                  <motion.tr
                    key={screen.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          screen.status === "ONLINE" ? "bg-green-400 animate-pulse" :
                          screen.status === "OFFLINE" ? "bg-red-400" : "bg-orange-400"
                        )} />
                        <span className="text-sm text-white font-medium">{screen.name.split("—")[0].trim()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-white/50">{screen.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/60">{screen.city}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/60">{getScreenTypeLabel(screen.type)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-white">{formatNumber(screen.dailyTraffic, true)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/60">${formatNumber(screen.pricePerSecond)}/s</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={screen.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/35">
                        {screen.lastPingAt ? formatRelativeTime(screen.lastPingAt) : "—"}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-white/30">No se encontraron pantallas.</p>
        </div>
      )}
    </div>
  );
}
