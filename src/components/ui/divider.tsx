import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────
 * Divider — horizontal rule with optional centered label.
 *
 * Use to separate page sections without the visual weight of a card border.
 *   <Divider />
 *   <Divider label="Detalles avanzados" />
 *   <Divider label="Sección" align="left" />
 * ────────────────────────────────────────────────────────────────────── */

interface DividerProps {
  label?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export function Divider({ label, align = "center", className }: DividerProps) {
  if (!label) {
    return <hr className={cn("border-0 h-px bg-white/[0.06]", className)} />;
  }

  const labelEl = (
    <span className="px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-white/35">
      {label}
    </span>
  );

  return (
    <div className={cn("relative flex items-center gap-3", className)}>
      {align !== "left" && <div className="flex-1 h-px bg-white/[0.06]" />}
      {labelEl}
      {align !== "right" && <div className="flex-1 h-px bg-white/[0.06]" />}
    </div>
  );
}

/** Vertical divider — for inline groupings like toolbars. */
export function DividerY({ className }: { className?: string }) {
  return <div className={cn("w-px h-4 bg-white/[0.08]", className)} />;
}
