"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Eye, MousePointerClick, QrCode, TrendingUp,
  Download, Calendar, BarChart3, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { mockChartData, mockDashboardMetrics } from "@/lib/mock-data";
import { formatNumber, formatCurrency, cn } from "@/lib/utils";

const DATE_RANGES = ["7d", "14d", "30d", "90d"];

const CITY_DATA = [
  { city: "Medellín", impressions: 2400000, clicks: 62000, color: "#B8EB23" },
  { city: "Bogotá", impressions: 1800000, clicks: 48000, color: "#3B82F6" },
  { city: "Bello", impressions: 420000, clicks: 9800, color: "#A78BFA" },
  { city: "Manizales", impressions: 230000, clicks: 5400, color: "#F59E0B" },
];

const HOUR_DATA = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h.toString().padStart(2, "0")}:00`,
  impressions: h >= 7 && h <= 22
    ? Math.floor(Math.random() * 80000 + (h >= 11 && h <= 14 ? 40000 : h >= 17 && h <= 20 ? 60000 : 10000))
    : Math.floor(Math.random() * 5000),
}));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-2xl">
      <p className="text-xs text-white/50 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-xs text-white/60">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-white">{formatNumber(entry.value, true)}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [range, setRange] = useState("30d");

  const chartSlice = range === "7d" ? mockChartData.slice(-7)
    : range === "14d" ? mockChartData.slice(-14)
    : range === "90d" ? mockChartData
    : mockChartData.slice(-30);

  const m = mockDashboardMetrics;

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Analytics</h2>
          <p className="text-xs text-white/40 mt-0.5">Rendimiento de toda la plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            {DATE_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  range === r
                    ? "bg-[#B8EB23]/10 text-[#B8EB23]"
                    : "text-white/40 hover:text-white"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Impresiones" value={m.totalImpressions} delta={m.impressionsDelta} icon={<Eye className="w-5 h-5" />} highlight index={0} />
        <MetricCard title="Clicks" value={formatNumber(342000)} delta={12.8} icon={<MousePointerClick className="w-5 h-5" />} index={1} />
        <MetricCard title="Escaneos QR" value={m.qrScans} delta={m.qrScansDelta} icon={<QrCode className="w-5 h-5" />} index={2} />
        <MetricCard title="CTR promedio" value="2.84%" delta={0.4} icon={<TrendingUp className="w-5 h-5" />} index={3} />
      </div>

      {/* Main chart: Impressions over time */}
      <Card>
        <CardHeader
          title="Impresiones & Clicks"
          subtitle={`Últimos ${range}`}
          icon={<BarChart3 className="w-4 h-4" />}
        />
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartSlice} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="imp-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B8EB23" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#B8EB23" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="clk-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v, true)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="impressions" name="Impresiones" stroke="#B8EB23" strokeWidth={2} fill="url(#imp-grad)" dot={false} activeDot={{ r: 4, fill: "#B8EB23", strokeWidth: 0 }} />
              <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#3B82F6" strokeWidth={1.5} fill="url(#clk-grad)" dot={false} activeDot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Two column charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* By city */}
        <Card>
          <CardHeader title="Impresiones por ciudad" subtitle="Distribución geográfica" />
          <CardContent className="pt-4 space-y-3">
            {CITY_DATA.map((city) => {
              const maxImp = Math.max(...CITY_DATA.map((c) => c.impressions));
              const pct = Math.round((city.impressions / maxImp) * 100);
              return (
                <div key={city.city} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: city.color }} />
                      <span className="text-white/70 font-medium">{city.city}</span>
                    </div>
                    <span className="text-white font-semibold tabular-nums">
                      {formatNumber(city.impressions, true)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: city.color }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Hourly heatmap */}
        <Card>
          <CardHeader title="Pico de impresiones por hora" subtitle="Promedio últimos 30 días" />
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={HOUR_DATA} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                />
                <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v, true)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="impressions" name="Impresiones" radius={[3, 3, 0, 0]}>
                  {HOUR_DATA.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.impressions > 80000 ? "#B8EB23" : entry.impressions > 40000 ? "rgba(184,235,35,0.5)" : "rgba(255,255,255,0.06)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-end gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                <span className="w-2 h-2 rounded-sm bg-[#B8EB23]" />Alto tráfico
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                <span className="w-2 h-2 rounded-sm bg-[#B8EB23]/50" />Medio
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                <span className="w-2 h-2 rounded-sm bg-white/[0.06]" />Bajo
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR + Engagement line */}
      <Card>
        <CardHeader title="QR Scans & Engagements" subtitle="Interacciones físico-digitales" />
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartSlice} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v, true)} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="qrScans" name="QR Scans" stroke="#A78BFA" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#A78BFA", strokeWidth: 0 }} />
              <Line type="monotone" dataKey="engagements" name="Engagements" stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#F59E0B", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
