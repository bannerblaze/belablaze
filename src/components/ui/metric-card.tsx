"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatNumber, formatPercent, getDeltaColor } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon: React.ReactNode;
  iconBg?: string;
  suffix?: string;
  compact?: boolean;
  highlight?: boolean;
  index?: number;
}

export function MetricCard({
  title,
  value,
  delta,
  deltaLabel = "vs mes anterior",
  icon,
  iconBg = "bg-white/[0.06]",
  suffix,
  compact = false,
  highlight = false,
  index = 0,
}: MetricCardProps) {
  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;
  const isNeutral = delta === undefined || delta === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "relative rounded-xl border p-4 lg:p-5 overflow-hidden group transition-all duration-200",
        highlight
          ? "bg-[#B8EB23]/[0.04] border-[#B8EB23]/20 hover:border-[#B8EB23]/35 hover:bg-[#B8EB23]/[0.07]"
          : "bg-[#111111] border-white/[0.06] hover:border-white/10 hover:bg-[#141414]"
      )}
    >
      {/* Glow for highlight */}
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#B8EB23]/[0.05] to-transparent pointer-events-none" />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
            highlight ? "bg-[#B8EB23]/15 text-[#B8EB23]" : `${iconBg} text-white/60`
          )}>
            {icon}
          </div>

          {/* Delta badge */}
          {delta !== undefined && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0",
              isPositive ? "bg-green-400/10 text-green-400" :
              isNegative ? "bg-red-400/10 text-red-400" :
              "bg-white/[0.06] text-white/40"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> :
               isNegative ? <TrendingDown className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />}
              {isPositive ? "+" : ""}{formatPercent(Math.abs(delta ?? 0), 1)}
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-end gap-1.5">
            <span className={cn(
              "font-bold tracking-tight",
              compact ? "text-xl lg:text-2xl" : "text-2xl lg:text-3xl",
              highlight ? "text-[#B8EB23]" : "text-white"
            )}>
              {typeof value === "number" ? formatNumber(value, true) : value}
            </span>
            {suffix && <span className="text-sm text-white/40 mb-1">{suffix}</span>}
          </div>
          <p className="text-xs text-white/50 mt-1.5 font-medium">{title}</p>
          {delta !== undefined && (
            <p className="text-[11px] text-white/30 mt-1">{deltaLabel}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
