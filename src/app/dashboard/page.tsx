"use client";

import { motion } from "framer-motion";
import {
  Eye, TrendingUp, DollarSign, Zap, MonitorPlay,
  ClipboardCheck, QrCode, Activity, ArrowUpRight,
  Clock, CheckCircle2, XCircle, AlertCircle, Circle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { RealtimeChart } from "@/components/dashboard/realtime-chart";
import { CampaignStatusChart } from "@/components/dashboard/campaign-status-chart";
import {
  mockDashboardMetrics, mockChartData, mockAds,
  mockCampaigns, mockRecentActivity, mockScreens,
} from "@/lib/mock-data";
import {
  formatCurrency, formatNumber, formatRelativeTime,
  formatDate, getStatusConfig, truncate,
} from "@/lib/utils";
import Link from "next/link";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

function ActivityIcon({ action }: { action: string }) {
  const icons: Record<string, React.ReactNode> = {
    APPROVE: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
    REJECT: <XCircle className="w-3.5 h-3.5 text-red-400" />,
    CREATE: <Zap className="w-3.5 h-3.5 text-[#B8EB23]" />,
    UPDATE: <AlertCircle className="w-3.5 h-3.5 text-blue-400" />,
    PAUSE: <Circle className="w-3.5 h-3.5 text-orange-400" />,
  };
  return <>{icons[action] ?? <Circle className="w-3.5 h-3.5 text-white/30" />}</>;
}

export default function DashboardPage() {
  const m = mockDashboardMetrics;
  const pendingAds = mockAds.filter((a) => a.status === "PENDING_REVIEW");
  const activeCampaigns = mockCampaigns.filter((c) => c.status === "ACTIVE");
  const onlineScreens = mockScreens.filter((s) => s.status === "ONLINE");

  return (
    <div className="px-8 py-8 space-y-8 max-w-[1600px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Buenos días, <span className="text-[#B8EB23]">Alejandro</span> 👋
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B8EB23]/10 border border-[#B8EB23]/20 text-[#B8EB23] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8EB23] animate-pulse" />
            {onlineScreens.length} pantallas en vivo
          </div>
          {m.pendingApprovals > 0 && (
            <Link href="/approvals">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-medium hover:bg-yellow-400/15 transition-all cursor-pointer">
                <ClipboardCheck className="w-3.5 h-3.5" />
                {m.pendingApprovals} pendientes de aprobación
              </div>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        <MetricCard
          title="Impresiones totales"
          value={m.totalImpressions}
          delta={m.impressionsDelta}
          icon={<Eye className="w-5 h-5" />}
          iconBg="bg-[#B8EB23]/10"
          highlight
          index={0}
        />
        <MetricCard
          title="Campañas activas"
          value={m.activeCampaigns}
          delta={m.campaignsDelta}
          icon={<Activity className="w-5 h-5" />}
          iconBg="bg-blue-500/10"
          index={1}
        />
        <MetricCard
          title="Ingresos del mes"
          value={formatCurrency(m.totalRevenue)}
          delta={m.revenueDelta}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-green-500/10"
          index={2}
        />
        <MetricCard
          title="Escaneos QR"
          value={m.qrScans}
          delta={m.qrScansDelta}
          icon={<QrCode className="w-5 h-5" />}
          iconBg="bg-purple-500/10"
          index={3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Realtime Chart — Main */}
        <motion.div
          {...fadeUp}
          className="col-span-12 xl:col-span-8"
        >
          <Card>
            <CardHeader
              title="Rendimiento en tiempo real"
              subtitle="Últimos 30 días"
              action={
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#B8EB23]" />Impresiones
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />Clicks
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />Engagements
                    </span>
                  </div>
                </div>
              }
            />
            <CardContent className="pt-6">
              <RealtimeChart data={mockChartData} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Campaign status */}
        <motion.div
          {...fadeUp}
          className="col-span-12 xl:col-span-4"
        >
          <Card className="h-full">
            <CardHeader title="Estado de campañas" subtitle="5 campañas totales" />
            <CardContent className="pt-6">
              <CampaignStatusChart />
              <div className="mt-6 space-y-4">
                {activeCampaigns.slice(0, 2).map((campaign) => {
                  const pct = Math.round((campaign.spent / campaign.budget) * 100);
                  return (
                    <div key={campaign.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/70 font-medium truncate pr-2">{truncate(campaign.name, 28)}</span>
                        <span className="text-xs text-white/40 flex-shrink-0">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                          className="h-full bg-[#B8EB23] rounded-full"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-white/30">
                        <span>{formatCurrency(campaign.spent)} gastado</span>
                        <span>de {formatCurrency(campaign.budget)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Active Campaigns Table */}
        <motion.div
          {...fadeUp}
          className="col-span-12 xl:col-span-7"
        >
          <Card>
            <CardHeader
              title="Campañas activas"
              subtitle="Rendimiento en tiempo real"
              action={
                <Link href="/campaigns">
                  <button className="flex items-center gap-1 text-xs text-white/40 hover:text-[#B8EB23] transition-colors">
                    Ver todas <ArrowUpRight className="w-3 h-3" />
                  </button>
                </Link>
              }
            />
            <CardContent className="pt-5 pb-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Campaña", "Cliente", "Presupuesto", "Impresiones", "Estado"].map((h) => (
                        <th key={h} className="text-left px-4 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockCampaigns.slice(0, 4).map((c, i) => {
                      const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
                      return (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-4 py-4">
                            <div className="font-medium text-sm text-white truncate max-w-[180px]">{c.name}</div>
                            <div className="text-[11px] text-white/30 mt-0.5">
                              {formatDate(c.endDate)} · {formatNumber(c.impressions, true)} imp.
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs text-white/60">{c.client?.name}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs text-white font-medium">{formatCurrency(c.budget)}</div>
                            <div className="h-1 w-16 bg-white/[0.06] rounded-full mt-1.5 overflow-hidden">
                              <div className="h-full bg-[#B8EB23] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs font-semibold text-white">{formatNumber(c.impressions, true)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={c.status} size="sm" />
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity + Screens Status */}
        <div className="col-span-12 xl:col-span-5 space-y-5">
          {/* Screens */}
          <motion.div {...fadeUp}>
            <Card>
              <CardHeader
                title="Estado de pantallas"
                subtitle={`${onlineScreens.length}/${mockScreens.length} en línea`}
                action={
                  <Link href="/screens">
                    <button className="text-xs text-white/40 hover:text-[#B8EB23] transition-colors flex items-center gap-1">
                      Ver mapa <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </Link>
                }
              />
              <CardContent className="pt-5 grid grid-cols-2 gap-3">
                {mockScreens.slice(0, 4).map((screen) => {
                  const cfg = getStatusConfig(screen.status);
                  return (
                    <div
                      key={screen.id}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${screen.status === "ONLINE" ? "animate-pulse-brand" : ""}`} />
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-white truncate leading-none">{screen.name.split("—")[0].trim()}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{screen.city} · {cfg.label}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity */}
          <motion.div {...fadeUp}>
            <Card>
              <CardHeader
                title="Actividad reciente"
                icon={<Activity className="w-4 h-4" />}
              />
              <CardContent className="pt-5 space-y-0">
                {mockRecentActivity.slice(0, 5).map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 py-3.5 border-b border-white/[0.04] last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ActivityIcon action={activity.action} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-white font-medium leading-snug truncate">
                        {activity.entityName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-white/35">{activity.user}</span>
                        <span className="text-white/20">·</span>
                        <span className="text-[11px] text-white/30">{formatRelativeTime(activity.time)}</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        activity.action === "APPROVE" ? "success" :
                        activity.action === "REJECT" ? "danger" :
                        activity.action === "CREATE" ? "brand" : "default"
                      }
                      size="sm"
                    >
                      {activity.action === "APPROVE" ? "Aprobado" :
                       activity.action === "REJECT" ? "Rechazado" :
                       activity.action === "CREATE" ? "Creado" :
                       activity.action === "PAUSE" ? "Pausado" : "Actualizado"}
                    </Badge>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Pending approvals alert */}
      {pendingAds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.04] px-6 py-5 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 flex-shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {pendingAds.length} anuncio{pendingAds.length > 1 ? "s" : ""} pendiente{pendingAds.length > 1 ? "s" : ""} de aprobación
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                Revisa y aprueba los anuncios para que inicien su publicación.
              </p>
            </div>
          </div>
          <Link href="/approvals">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/20 transition-all flex-shrink-0">
              Revisar ahora <ArrowUpRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
