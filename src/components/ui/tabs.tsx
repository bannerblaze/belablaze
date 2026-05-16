"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────
 * Tabs — premium segmented & underline tab primitives.
 *
 * Two variants:
 *   - segmented: pill-shaped container, sliding indicator (Linear style)
 *   - underline: bottom bar that glides between tabs (Stripe/Vercel style)
 *
 * Fully controlled via `value` + `onChange` to keep state ownership at
 * the parent. No internal storage = composable with URL/query state.
 * ────────────────────────────────────────────────────────────────────── */

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  /** Optional dot (e.g. status indicator). */
  dot?: string;
}

interface TabsProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  items: ReadonlyArray<TabItem<T>>;
  variant?: "segmented" | "underline";
  size?: "sm" | "md";
  className?: string;
  fullWidth?: boolean;
}

export function Tabs<T extends string = string>({
  value,
  onChange,
  items,
  variant = "segmented",
  size = "md",
  className,
  fullWidth = false,
}: TabsProps<T>) {
  if (variant === "underline") {
    return (
      <div className={cn("relative flex items-center gap-0 border-b border-white/[0.06]", fullWidth && "w-full", className)}>
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              onClick={() => onChange(item.value)}
              className={cn(
                "relative inline-flex items-center gap-2 transition-colors",
                size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm",
                active
                  ? "text-white font-semibold"
                  : "text-white/45 hover:text-white/80 font-medium",
                fullWidth && "flex-1 justify-center",
              )}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              {item.label}
              {item.badge && <span className="ml-0.5">{item.badge}</span>}
              {active && (
                <motion.span
                  layoutId="tabs-underline"
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute inset-x-2 -bottom-px h-[1.5px] rounded-full bg-[#B8EB23]"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // segmented (default)
  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-0.5 p-1 rounded-xl bg-[#0E0E10] border border-white/[0.06]",
        fullWidth && "w-full",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors",
              size === "sm" ? "px-2.5 py-1.5 text-[11px]" : "px-3.5 py-2 text-xs",
              active ? "text-white" : "text-white/45 hover:text-white/80",
              fullWidth && "flex-1 justify-center",
            )}
          >
            {item.dot && <span className={cn("w-1.5 h-1.5 rounded-full", item.dot)} />}
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            {item.label}
            {item.badge && (
              <span className={cn(
                "ml-1 inline-flex items-center justify-center min-w-[18px] px-1.5 rounded-md text-[10px] font-bold tabular-nums",
                active ? "bg-black/40 text-white/80" : "bg-white/[0.06] text-white/40",
              )}>
                {item.badge}
              </span>
            )}
            {active && (
              <motion.span
                layoutId="tabs-segmented"
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 -z-10 rounded-lg bg-white/[0.07]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
