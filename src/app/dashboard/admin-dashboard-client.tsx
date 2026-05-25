"use client";

import { motion } from "framer-motion";
import {
  Building2, TrendingUp, Eye, Monitor, ClipboardCheck,
  BadgeCheck, DollarSign, Activity, Clock,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatCurrency, cn } from "@/lib/utils";

type AdminData = {
  kpis: {
    totalOrgs: number;
    newOrgsThisMonth: number;
    activeCampaigns: number;
    screensOnline: number;
    pendingAds: number;
    approvalRate: number;
    impressionsToday: number;
    revenueThisMonth: number;
    spentThisMonth: number;
  };
  topOrgs: {
    id: string;
    name: string;
    activeCampaigns: number;
    totalBudget: number;
    totalSpent: number;
    totalImpressions: number;
  }[];
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    user: { name: string | null; email: string } | null;
    organization: { name: string } | null;
  }[];
  chartData: { date: string; impressions: number; clicks: number }[];
};

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.07 },
});

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
  warn,
  danger,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  warn?: boolean;
  danger?: boolean;
  index: number;
}) {
  const color = highlight
    ? "text-[#B8EB23]"
    : warn
    ? "text-yellow-400"
    : danger
    ? "text-red-400"
    : "text-white";

  const bg = highlight
    ? "bg-[#B8EB23]/[0.04] border-[#B8EB23]/15"
    : warn
    ? "bg-yellow-400/[0.04] border-yellow-400/15"
    : danger
    ? "bg-red-400/[0.04] border-red-400/15"
    : "bg-white/[0.02] border-white/[0.05]";

  return (
    <motion.div
      {...stagger(index)}
      className={cn("flex flex-col gap-1.5 p-4 rounded-xl border", bg)}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={cn("w-3.5 h-3.5", highlight ? "text-[#B8EB23]/60" : warn ? "text-yellow-400/60" : danger ? "text-red-400/60" : "text-white/30")} />
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/30">{label}</span>
      </div>
      <span className={cn("text-2xl font-bold tabular-nums", color)}>{value}</span>
      {sub && <span className="text-[11px] text-white/30">{sub}</span>}
    </motion.div>
  );
}

export function AdminDashboardClient({ data }: { data: AdminData }) {
  const { kpis, topOrgs, recentActivity, chartData } = data;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 space-y-6 max-w-[1400px]">

      {/* Header */}
      <motion.div {...stagger(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Centro de control · <span className="text-[#B8EB23]">BannerBlaze</span>
            </h1>
            <Badge variant="brand" size="sm">Vista administrativa</Badge>
          </div>
          <p suppressHydrationWarning className="text-xs text-white/40">
            {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </motion.div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard
          icon={Building2}
          label="Organizaciones activas"
          value={formatNumber(kpis.totalOrgs)}
          sub={`+${kpis.newOrgsThisMonth} este mes`}
          highlight
          index={1}
        />
        <KpiCard
          icon={DollarSign}
          label="Ingresos del mes"
          value={formatCurrency(kpis.revenueThisMonth)}
          sub={`${formatCurrency(kpis.spentThisMonth)} ejecutado`}
          index={2}
        />
        <KpiCard
          icon={Eye}
          label="Impresiones hoy"
          value={formatNumber(kpis.impressionsToday, true)}
          index={3}
        />
        <KpiCard
          icon={Monitor}
          label="Pantallas online"
          value={formatNumber(kpis.screensOnline)}
          index={4}
        />
        <KpiCard
          icon={ClipboardCheck}
          label="Pendientes aprobación"
          value={formatNumber(kpis.pendingAds)}
          warn={kpis.pendingAds > 0}
          index={5}
        />
        <KpiCard
          icon={BadgeCheck}
          label="Tasa de aprobación"
          value={`${kpis.approvalRate}%`}
          highlight={kpis.approvalRate >= 70}
          danger={kpis.approvalRate < 50 && kpis.approvalRate > 0}
          index={6}
        />
      </div>

      {/* Global impressions chart */}
      <motion.div {...stagger(3)}>
        <Card>
          <CardHeader
            title="Impresiones globales"
            subtitle="Últimos 30 días — toda la plataforma"
            icon={<TrendingUp className="w-4 h-4" />}
            action={
              <div className="hidden sm:flex items-center gap-3 text-xs text-white/40">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#B8EB23]" />Impresiones</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />Clicks</span>
              </div>
            }
          />
          <CardContent className="pt-4">
            {chartData.length === 0 ? (
              <div className="h-[220px] rounded-xl bg-white/[0.03] animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="admin-imp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B8EB23" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#B8EB23" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="admin-clk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v, true)} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}
                  />
                  <Area type="monotone" dataKey="impressions" name="Impresiones" stroke="#B8EB23" strokeWidth={2} fill="url(#admin-imp)" dot={false} activeDot={{ r: 4, fill: "#B8EB23", strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#3B82F6" strokeWidth={1.5} fill="url(#admin-clk)" dot={false} activeDot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Top orgs table */}
        <motion.div {...stagger(4)}>
          <Card className="h-full">
            <CardHeader
              title="Top organizaciones"
              subtitle="Por campañas activas"
              icon={<Activity className="w-4 h-4" />}
            />
            <CardContent className="pt-3 pb-0">
              {topOrgs.length === 0 ? (
                <p className="text-xs text-white/30 py-6 text-center">Sin datos aún</p>
              ) : (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full min-w-[420px]">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {["Organización", "Campañas", "Impresiones", "Presupuesto", "Gastado"].map((h) => (
                          <th key={h} className="text-left px-2 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider first:pl-0">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topOrgs.map((org, i) => (
                        <motion.tr
                          key={org.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-2 py-3 first:pl-0">
                            <span className="text-sm font-medium text-white truncate block max-w-[130px]">{org.name}</span>
                          </td>
                          <td className="px-2 py-3">
                            <span className="text-xs text-[#B8EB23] font-semibold">{org.activeCampaigns}</span>
                          </td>
                          <td className="px-2 py-3">
                            <span className="text-xs text-white/70">{formatNumber(org.totalImpressions, true)}</span>
                          </td>
                          <td className="px-2 py-3">
                            <span className="text-xs text-white/70">{formatCurrency(org.totalBudget)}</span>
                          </td>
                          <td className="px-2 py-3">
                            <span className="text-xs text-white/70">{formatCurrency(org.totalSpent)}</span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent global activity */}
        <motion.div {...stagger(5)}>
          <Card className="h-full">
            <CardHeader
              title="Actividad reciente"
              subtitle="Últimas acciones en la plataforma"
              icon={<Clock className="w-4 h-4" />}
            />
            <CardContent className="pt-3 space-y-0.5">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-white/30 py-6 text-center">Sin actividad reciente</p>
              ) : (
                recentActivity.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Activity className="w-3 h-3 text-white/30" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white/70 leading-snug">
                        <span className="font-medium text-white">{entry.user?.name ?? entry.user?.email ?? "Sistema"}</span>
                        {" · "}
                        <span className="text-white/40">{entry.action}</span>
                      </p>
                      <p className="text-[11px] text-white/30 mt-0.5">
                        {entry.organization?.name ?? "—"} · {timeAgo(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
