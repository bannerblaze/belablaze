"use client";

import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  format?: "compact" | "number" | "currency" | "percent";
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ value, format = "compact", className, duration = 800 }: AnimatedNumberProps) {
  const display = useAnimatedNumber(value, duration);

  const formatted =
    format === "currency" ? formatCurrency(display) :
    format === "percent" ? `${display}%` :
    format === "number" ? formatNumber(display, false) :
    formatNumber(display, true);

  return <span className={className}>{formatted}</span>;
}
