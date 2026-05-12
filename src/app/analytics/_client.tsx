"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Eye, MousePointerClick, QrCode, TrendingUp,
  Download, BarChart3, Layers, Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import type { ChartDataPoint, DashboardMetrics } from "@/types";
import { formatNumber, formatCurrency, cn } from "@/lib/utils";

const DATE_RANGES = ["7d", "14d", "30d", "90d"];
const CITY_COLORS = ["#B8EB23", "#3B82F6", "#A78BFA", "#F59E0B", "#EC4899"];

const HOUR_DATA = Array.from({ length: 24 }, (_, h) => {
  const base = h >= 7 && h <= 22 ? (h >= 11 && h <= 14 ? 120000 : h >= 17 && h <= 20 ? 150000 : 60000) : 8000;
  return { hour: `${h.toString().padStart(2, "0")}:00`, impressions: base + Math.floor(Math.random() * 20000) };
});

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; color: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-2xl">
      <p className="text-xs text-white/50 mb-2">{label}</p>
      {payload.map((entry) => (
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

type TopCampaign = {
  id: string;
  name: string;
  impressions: number;
  spent: number;
  budget: number;
  status: string;
  client?: { name: string } | null;
};

type CityMetric = { city: string; impressions: number; clicks: number; traffic?: number };

interface AnalyticsClientProps {
  chartData: ChartDataPoint[];
  metrics: DashboardMetrics;
  topCampaigns: TopCampaign[];
  cityMetrics: CityMetric[];
}

export function AnalyticsClient({ chartData, metrics: m, topCampaigns, cityMetrics }: AnalyticsClientProps) {
  const [range, setRange] = useState("30d");

  const chartSlice = range === "7d" ? chartData.slice(-7)
    : range === "14d" ? chartData.slice(-14)
    : range === "90d" ? chartData
    : chartData.slice(-30);

  const totalClicks = chartData.reduce((s, d) => s + d.clicks, 0);
  const maxCityImp = Math.max(...cityMetrics.map((c) => c.impressions), 1);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Analytics</h2>
          <p className="text-xs text-white/40 mt-0.5">Rendimiento de toda la plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            {DATE_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  range === r ? "bg-[#B8EB23]/10 text-[#B8EB23]" : "text-white/40 hover:text-white"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
            Exportar
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <MetricCard title="Impresiones" value={m.totalImpressions} delta={m.impressionsDelta} icon={<Eye className="w-5 h-5" />} highlight index={0} />
        <MetricCard title="Clicks totales" value={totalClicks} delta={12.8} icon={<MousePointerClick className="w-5 h-5" />} index={1} />
        <MetricCard title="Escaneos QR" value={m.qrScans} delta={m.qrScansDelta} icon={<QrCode className="w-5 h-5" />} index={2} />
        <MetricCard title="Engagement" value={`${m.avgEngagement}%`} delta={0.4} icon={<TrendingUp className="w-5 h-5" />} index={3} />
      </div>

      {/* Main chart */}
      <Card>
        <CardHeader
          title="Impresiones & Clicks"
          subtitle={`Últimos ${range}`}
          icon={<BarChart3 className="w-4 h-4" />}
          action={
            <div className="hidden sm:flex items-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#B8EB23]" />Impresiones</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />Clicks</span>
            </div>
          }
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* City breakdown (real data) */}
        <Card>
          <CardHeader title="Impresiones por ciudad" subtitle="Distribución geográfica real" />
          <CardContent className="pt-4 space-y-3">
            {cityMetrics.slice(0, 5).map((city, i) => {
              const pct = Math.round((city.impressions / maxCityImp) * 100);
              const color = CITY_COLORS[i % CITY_COLORS.length];
              return (
                <div key={city.city} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-white/70 font-medium">{city.city}</span>
                    </div>
                    <span className="text-white font-semibold tabular-nums">{formatNumber(city.impressions, true)}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: color }}
                    />
                  </div>
                  <div className="text-[10px] text-white/25">{formatNumber(city.clicks, true)} clicks</div>
                </div>
              );
            })}
            {cityMetrics.length === 0 && (
              <p className="text-xs text-white/30 py-4 text-center">Sin datos de ciudades aún</p>
            )}
          </CardContent>
        </Card>

        {/* Hourly chart */}
        <Card>
          <CardHeader title="Pico de impresiones por hora" subtitle="Distribución típica del día" />
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={HOUR_DATA} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v, true)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="impressions" name="Impresiones" radius={[3, 3, 0, 0]}>
                  {HOUR_DATA.map((entry, i) => (
                    <Cell key={i} fill={
                      entry.impressions > 140000 ? "#B8EB23" :
                      entry.impressions > 100000 ? "rgba(184,235,35,0.5)" :
                      "rgba(255,255,255,0.06)"
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-end gap-3 mt-2">
              {[["#B8EB23", "Alto tráfico"], ["rgba(184,235,35,0.5)", "Medio"], ["rgba(255,255,255,0.06)", "Bajo"]].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5 text-[11px] text-white/40">
                  <span className="w-2 h-2 rounded-sm" style={{ background: color }} />{label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR + Engagements chart */}
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

      {/* Top campaigns (real data) */}
      {topCampaigns.length > 0 && (
        <Card>
          <CardHeader title="Top campañas por impresiones" subtitle="Campaña con mejor rendimiento" icon={<Trophy className="w-4 h-4" />} />
          <CardContent className="pt-4">
            <div className="space-y-3">
              {topCampaigns.map((campaign, i) => {
                const pct = campaign.budget > 0 ? Math.min(100, Math.round((campaign.spent / campaign.budget) * 100)) : 0;
                const maxImp = Math.max(...topCampaigns.map((c) => c.impressions), 1);
                const barPct = Math.round((campaign.impressions / maxImp) * 100);
                return (
                  <div key={campaign.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                      i === 0 ? "bg-[#B8EB23]/20 text-[#B8EB23]" :
                      i === 1 ? "bg-blue-400/15 text-blue-400" :
                      "bg-white/[0.06] text-white/40"
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white truncate">{campaign.name}</p>
                        <StatusBadge status={campaign.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-white/40">
                        <span>{campaign.client?.name}</span>
                        <span>·</span>
                        <span>{formatNumber(campaign.impressions, true)} imp.</span>
                        <span>·</span>
                        <span>{formatCurrency(campaign.spent)} gastado</span>
                      </div>
                      <div className="h-1 bg-white/[0.05] rounded-full mt-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className={i === 0 ? "h-full bg-[#B8EB23] rounded-full" : "h-full bg-blue-400/60 rounded-full"}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white">{formatNumber(campaign.impressions, true)}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{pct}% presup.</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
