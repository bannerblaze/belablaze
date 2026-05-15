"use client";

import { Wifi, WifiOff, Wrench, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScreenStatus } from "@/types";

/* Reusable status pill for screens. Pulses when ONLINE so the fleet
 * feels alive at a glance. Sizes match the rest of the app's badges. */

const CONFIG: Record<ScreenStatus, {
  label: string;
  text: string;
  bg: string;
  border: string;
  dot: string;
  glow: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  ONLINE: {
    label: "En línea",
    text: "text-[#B8EB23]",
    bg: "bg-[#B8EB23]/10",
    border: "border-[#B8EB23]/25",
    dot: "bg-[#B8EB23]",
    glow: "shadow-[0_0_12px_rgba(184,235,35,0.35)]",
    Icon: Wifi,
  },
  OFFLINE: {
    label: "Sin conexión",
    text: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/25",
    dot: "bg-red-400",
    glow: "",
    Icon: WifiOff,
  },
  MAINTENANCE: {
    label: "Mantenimiento",
    text: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/25",
    dot: "bg-orange-400",
    glow: "",
    Icon: Wrench,
  },
  RESERVED: {
    label: "Reservada",
    text: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/25",
    dot: "bg-blue-400",
    glow: "",
    Icon: Lock,
  },
};

interface Props {
  status: ScreenStatus;
  size?: "xs" | "sm" | "md";
  withIcon?: boolean;
  className?: string;
}

export function ScreenStatusBadge({ status, size = "sm", withIcon = false, className }: Props) {
  const c = CONFIG[status] ?? CONFIG.OFFLINE;
  const Icon = c.Icon;
  const sizing =
    size === "xs"
      ? "px-1.5 py-0.5 text-[9px] gap-1"
      : size === "md"
      ? "px-2.5 py-1 text-[11px] gap-1.5"
      : "px-2 py-0.5 text-[10px] gap-1.5";

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full border whitespace-nowrap",
        sizing,
        c.text,
        c.bg,
        c.border,
        className,
      )}
    >
      <span className="relative inline-flex flex-shrink-0">
        <span className={cn("rounded-full", c.dot, size === "xs" ? "w-1 h-1" : "w-1.5 h-1.5")} />
        {status === "ONLINE" && (
          <span
            className={cn(
              "absolute inset-0 rounded-full animate-ping",
              c.dot,
              "opacity-60",
            )}
          />
        )}
      </span>
      {withIcon && <Icon className={cn(size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3")} />}
      {c.label}
    </span>
  );
}

/** Tiny pulse dot only — for dense overviews where the label gets in the way. */
export function ScreenStatusDot({ status, className }: { status: ScreenStatus; className?: string }) {
  const c = CONFIG[status] ?? CONFIG.OFFLINE;
  return (
    <span className={cn("relative inline-flex flex-shrink-0", className)}>
      <span className={cn("w-2 h-2 rounded-full", c.dot, c.glow)} />
      {status === "ONLINE" && (
        <span className={cn("absolute inset-0 rounded-full animate-ping opacity-60", c.dot)} />
      )}
    </span>
  );
}
