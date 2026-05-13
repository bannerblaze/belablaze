"use client";

import { motion } from "framer-motion";
import {
  Eye, DollarSign, Zap,
  ClipboardCheck, QrCode, Activity, ArrowUpRight,
  CheckCircle2, XCircle, AlertCircle, Circle, Radio,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { RealtimeChart } from "@/components/dashboard/realtime-chart";
import { CampaignStatusChart } from "@/components/dashboard/campaign-status-chart";
import { useRealtimeMetrics } from "@/hooks/use-realtime";
import {
  formatCurrency, formatNumber, formatRelativeTime,
  formatDate, getStatusConfig, truncate,
} from "@/lib/utils";
import Link from "next/link";
import type { DashboardMetrics, ChartDataPoint } from "@/types";
import { useAppStore } from "@/store";

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.08 },
});

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

function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#B8EB23]/10 border border-[#B8EB23]/20">
      <Radio className="w-2.5 h-2.5 text-[#B8EB23] animate-pulse" />
      <span className="text-[9px] font-bold tracking-widest uppercase text-[#B8EB23]">Live</span>
    </div>
  );
}

type ActivityItem = {
  id: string;
  action: string;
  entityName: string;
  user: string;
  time: string;
};

type CampaignSummary = {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  endDate: string;
  client?: { name: string } | null;
};

type ScreenSummary = {
  id: string;
  name: string;
  city: string;
  status: string;
};

interface DashboardClientProps {
  metrics: DashboardMetrics;
  chartData: ChartDataPoint[];
  recentActivity: ActivityItem[];
  campaigns: CampaignSummary[];
  screens: ScreenSummary[];
  userName: string;
}

export function DashboardClient({
  metrics: initialMetrics,
  chartData,
  recentActivity,
  campaigns,
  screens,
  userName,
}: DashboardClientProps) {
  const m = useRealtimeMetrics(initialMetrics);
  const isRealtime = useAppStore((s) => s.isRealtime);

  const pendingApprovalsCount = m.pendingApprovals;
  const onlineCount = m.screensOnline;
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 18) return "Buenas tardes";
    return "Buenas noches";
  })();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 space-y-5 lg:space-y-7 max-w-[1600px]">
      {/* Header */}
      <motion.div
        {...stagger(0)}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"
      >
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
            {greeting}, <span className="text-[#B8EB23]">{userName.split(" ")[0]}</span>
          </h1>
          <p className="text-xs lg:text-sm text-white/40 mt-1">
            {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isRealtime && <LiveBadge />}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B8EB23]/10 border border-[#B8EB23]/20 text-[#B8EB23] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8EB23] animate-pulse" />
            <AnimatedNumber value={onlineCount} format="number" /> pantallas en vivo
          </div>
          {pendingApprovalsCount > 0 && (
            <Link href="/approvals">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-medium hover:bg-yellow-400/15 transition-all cursor-pointer">
                <ClipboardCheck className="w-3.5 h-3.5" />
                {pendingApprovalsCount} pendientes
              </div>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Metric Cards — animated numbers, realtime data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        <MetricCard
          title="Impresiones"
          value={<AnimatedNumber value={m.totalImpressions} />}
          delta={m.impressionsDelta}
          icon={<Eye className="w-5 h-5" />}
          iconBg="bg-[#B8EB23]/10"
          highlight
          index={0}
        />
        <MetricCard
          title="Campañas activas"
          value={<AnimatedNumber value={m.activeCampaigns} format="number" />}
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
          value={<AnimatedNumber value={m.qrScans} />}
          delta={m.qrScansDelta}
          icon={<QrCode className="w-5 h-5" />}
          iconBg="bg-purple-500/10"
          index={3}
        />
      </div>

      {/* Chart + Campaign status */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <motion.div {...stagger(1)} className="xl:col-span-8">
          <Card>
            <CardHeader
              title="Rendimiento en tiempo real"
              subtitle="Últimos 30 días"
              action={
                <div className="flex items-center gap-3">
                  {isRealtime && <LiveBadge />}
                  <div className="hidden sm:flex items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#B8EB23]" />Impresiones</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />Clicks</span>
                    <span className="hidden md:flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" />Engagements</span>
                  </div>
                </div>
              }
            />
            <CardContent className="pt-4 lg:pt-6">
              <RealtimeChart data={chartData} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...stagger(2)} className="xl:col-span-4">
          <Card className="h-full">
            <CardHeader title="Estado de campañas" subtitle={`${campaigns.length} campañas totales`} />
            <CardContent className="pt-4 lg:pt-6">
              <CampaignStatusChart />
              <div className="mt-5 space-y-4">
                {activeCampaigns.slice(0, 2).map((campaign) => {
                  const pct = campaign.budget > 0 ? Math.round((campaign.spent / campaign.budget) * 100) : 0;
                  return (
                    <div key={campaign.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/70 font-medium truncate pr-2">{truncate(campaign.name, 26)}</span>
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
                {activeCampaigns.length === 0 && (
                  <p className="text-xs text-white/30 text-center py-4">Sin campañas activas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom: Campaigns + Screens + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Campaigns table */}
        <motion.div {...stagger(3)} className="xl:col-span-7">
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
            <CardContent className="pt-4 pb-0">
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Campaña", "Cliente", "Presupuesto", "Estado"].map((h) => (
                        <th key={h} className="text-left px-3 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider first:pl-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.slice(0, 5).map((c, i) => {
                      const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
                      return (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-3 py-3.5 first:pl-0">
                            <div className="font-medium text-sm text-white truncate max-w-[160px]">{truncate(c.name, 22)}</div>
                            <div className="text-[11px] text-white/30 mt-0.5">{formatDate(c.endDate)}</div>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className="text-xs text-white/60 truncate max-w-[100px] block">{c.client?.name ?? "—"}</span>
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="text-xs text-white font-medium">{formatCurrency(c.budget)}</div>
                            <div className="h-1 w-16 bg-white/[0.06] rounded-full mt-1.5 overflow-hidden">
                              <div className="h-full bg-[#B8EB23] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <StatusBadge status={c.status} size="sm" />
                          </td>
                        </motion.tr>
                      );
                    })}
                    {campaigns.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-sm text-white/30">
                          Sin campañas aún
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Screens + Activity */}
        <div className="xl:col-span-5 space-y-5">
          <motion.div {...stagger(4)}>
            <Card>
              <CardHeader
                title="Estado de pantallas"
                subtitle={`${m.screensOnline}/${m.screensTotal} en línea`}
                action={
                  <Link href="/screens">
                    <button className="text-xs text-white/40 hover:text-[#B8EB23] transition-colors flex items-center gap-1">
                      Ver todo <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </Link>
                }
              />
              <CardContent className="pt-4 grid grid-cols-2 gap-2.5">
                {screens.slice(0, 4).map((screen) => {
                  const cfg = getStatusConfig(screen.status);
                  const isOnline = screen.status === "ONLINE";
                  return (
                    <div
                      key={screen.id}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${isOnline ? "animate-pulse" : ""}`} />
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-white truncate leading-none">{screen.name.split("—")[0].trim()}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{screen.city} · {cfg.label}</p>
                      </div>
                    </div>
                  );
                })}
                {screens.length === 0 && (
                  <div className="col-span-2 py-6 text-center text-xs text-white/30">Sin pantallas</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...stagger(5)}>
            <Card>
              <CardHeader title="Actividad reciente" icon={<Activity className="w-4 h-4" />} />
              <CardContent className="pt-4 space-y-0">
                {recentActivity.slice(0, 5).map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.04 }}
                    className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ActivityIcon action={activity.action} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-white font-medium leading-snug truncate">{activity.entityName}</p>
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
                {recentActivity.length === 0 && (
                  <p className="text-sm text-white/30 text-center py-8">Sin actividad reciente</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Pending approvals CTA */}
      {pendingApprovalsCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.04] px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 flex-shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {pendingApprovalsCount} anuncio{pendingApprovalsCount > 1 ? "s" : ""} pendiente{pendingApprovalsCount > 1 ? "s" : ""} de aprobación
              </p>
              <p className="text-xs text-white/40 mt-0.5 hidden sm:block">
                Revisa y aprueba los anuncios para que inicien su publicación.
              </p>
            </div>
          </div>
          <Link href="/approvals" className="flex-shrink-0">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/20 transition-all">
              Revisar <ArrowUpRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
