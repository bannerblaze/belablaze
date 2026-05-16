"use client";

import { cn } from "@/lib/utils";
import type { UserStatusKey } from "@/services/admin/users.service";

/* Reusable pill for the admin user tables. Pulses on NEW so fresh
 * accounts pop out in long lists. */

const CONFIG: Record<UserStatusKey, {
  label: string;
  text: string;
  bg: string;
  border: string;
  dot: string;
  pulse: boolean;
}> = {
  ACTIVE:    { label: "Activo",     text: "text-[#B8EB23]",  bg: "bg-[#B8EB23]/10",  border: "border-[#B8EB23]/25",  dot: "bg-[#B8EB23]",  pulse: false },
  NEW:       { label: "Nuevo",      text: "text-[#B8EB23]",  bg: "bg-[#B8EB23]/15",  border: "border-[#B8EB23]/30",  dot: "bg-[#B8EB23]",  pulse: true  },
  INACTIVE:  { label: "Inactivo",   text: "text-white/55",   bg: "bg-white/[0.05]",  border: "border-white/[0.1]",   dot: "bg-white/40",   pulse: false },
  SUSPENDED: { label: "Suspendido", text: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/25",    dot: "bg-red-400",    pulse: false },
};

interface Props {
  status: UserStatusKey;
  size?: "xs" | "sm";
  className?: string;
}

export function UserStatusBadge({ status, size = "sm", className }: Props) {
  const c = CONFIG[status] ?? CONFIG.INACTIVE;
  const sizing =
    size === "xs"
      ? "px-1.5 py-0.5 text-[9px] gap-1"
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
        {c.pulse && (
          <span className={cn("absolute inset-0 rounded-full animate-ping opacity-60", c.dot)} />
        )}
      </span>
      {c.label}
    </span>
  );
}
