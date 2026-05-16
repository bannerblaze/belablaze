"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatNumber, formatPercent } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number | React.ReactNode;
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
  iconBg = "bg-white/[0.05]",
  suffix,
  compact = false,
  highlight = false,
  index = 0,
}: MetricCardProps) {
  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "relative rounded-2xl border p-5 overflow-hidden group transition-all duration-200",
        "min-h-[148px] flex flex-col justify-between",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
        highlight
          ? "bg-[#B8EB23]/[0.04] border-[#B8EB23]/20 hover:border-[#B8EB23]/35 hover:bg-[#B8EB23]/[0.06]"
          : "bg-[#0E0E10] border-white/[0.06] hover:border-white/[0.1] hover:bg-[#121214]",
      )}
    >
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#B8EB23]/[0.05] via-transparent to-transparent pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Top row: icon + delta badge — both have explicit room from edges */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className={cn(
            "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ring-1",
            highlight
              ? "bg-[#B8EB23]/15 text-[#B8EB23] ring-[#B8EB23]/15"
              : `${iconBg} text-white/65 ring-white/[0.04]`,
          )}>
            {icon}
          </div>

          {delta !== undefined && (
            <div className={cn(
              "inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-semibold flex-shrink-0 tabular-nums leading-none",
              isPositive ? "bg-green-400/[0.08] text-green-400 ring-1 ring-green-400/15" :
              isNegative ? "bg-red-400/[0.08] text-red-400 ring-1 ring-red-400/15" :
              "bg-white/[0.04] text-white/40 ring-1 ring-white/[0.05]",
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" strokeWidth={2.5} /> :
               isNegative ? <TrendingDown className="w-3 h-3" strokeWidth={2.5} /> :
               <Minus className="w-3 h-3" strokeWidth={2.5} />}
              {isPositive ? "+" : ""}{formatPercent(Math.abs(delta ?? 0), 1)}
            </div>
          )}
        </div>

        {/* Bottom: value + title + sublabel — value is the visual anchor, sized restrainedly */}
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className={cn(
              "font-bold tracking-tight tabular-nums leading-none truncate",
              compact ? "text-xl" : "text-[22px] lg:text-[26px]",
              highlight ? "text-[#B8EB23]" : "text-white",
            )}>
              {typeof value === "number" ? formatNumber(value, true) : value as React.ReactNode}
            </span>
            {suffix && <span className="text-xs text-white/40 font-medium flex-shrink-0">{suffix}</span>}
          </div>
          <p className="text-[13px] text-white/70 font-medium truncate">{title}</p>
          {delta !== undefined && (
            <p className="text-[11px] text-white/35 truncate">{deltaLabel}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
