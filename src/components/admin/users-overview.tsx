"use client";

import { motion } from "framer-motion";
import {
  Users, Building2, UserCheck, Activity, Layers, HardDrive,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { staggerChild } from "@/lib/motion";
import type { AdminOverview } from "@/services/admin/users.service";

/* Stripe-Admin-style metric strip for the /clients panel. Six dense
 * tiles, accent strip per row, no plan/limits comparisons. */

interface TileProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: "brand" | "blue" | "violet" | "neutral";
  index: number;
}

const ACCENT: Record<TileProps["accent"], { bar: string; iconBg: string; iconText: string; ringHover: string }> = {
  brand:   { bar: "bg-[#B8EB23]",  iconBg: "bg-[#B8EB23]/10",  iconText: "text-[#B8EB23]",  ringHover: "hover:border-[#B8EB23]/35" },
  blue:    { bar: "bg-blue-400",   iconBg: "bg-blue-400/10",   iconText: "text-blue-400",   ringHover: "hover:border-blue-400/30" },
  violet:  { bar: "bg-violet-400", iconBg: "bg-violet-400/10", iconText: "text-violet-400", ringHover: "hover:border-violet-400/30" },
  neutral: { bar: "bg-white/30",   iconBg: "bg-white/[0.06]",  iconText: "text-white/60",   ringHover: "hover:border-white/15" },
};

function Tile({ label, value, sub, icon, accent, index }: TileProps) {
  const a = ACCENT[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={staggerChild(index)}
      className={cn(
        "relative rounded-xl bg-[#0F0F0F] border border-white/[0.06] overflow-hidden transition-colors duration-200",
        a.ringHover,
      )}
    >
      <div className={cn("h-[2px] w-full opacity-80", a.bar)} />
      <div className="p-3.5 lg:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", a.iconBg, a.iconText)}>
            {icon}
          </div>
        </div>
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35 leading-none">
            {label}
          </p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl lg:text-[22px] font-bold text-white tracking-tight tabular-nums leading-none">
              {value}
            </span>
            {sub && <span className="text-[11px] text-white/30 font-medium">{sub}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface Props {
  overview: AdminOverview;
}

export function UsersOverview({ overview }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 lg:gap-3">
      <Tile label="Usuarios"     value={formatNumber(overview.totalUsers)}         sub="totales"      icon={<Users className="w-4 h-4" />}      accent="brand"   index={0} />
      <Tile label="Empresas"     value={formatNumber(overview.totalOrganizations)} sub="con perfil"   icon={<Building2 className="w-4 h-4" />}  accent="brand"   index={1} />
      <Tile label="Creadores"    value={formatNumber(overview.totalCreators)}      sub="registrados"  icon={<UserCheck className="w-4 h-4" />}  accent="violet"  index={2} />
      <Tile label="Activos hoy"  value={formatNumber(overview.activeToday)}        sub="sesiones"     icon={<Activity className="w-4 h-4" />}   accent="blue"    index={3} />
      <Tile label="Campañas"     value={formatNumber(overview.totalCampaigns)}     sub="totales"      icon={<Layers className="w-4 h-4" />}     accent="neutral" index={4} />
      <Tile label="Storage"      value={formatNumber(overview.totalStorageMB, true)} sub="MB"         icon={<HardDrive className="w-4 h-4" />}  accent="brand"   index={5} />
    </div>
  );
}
