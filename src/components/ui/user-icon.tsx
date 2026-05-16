import { User } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────
 * UserIcon — single source of truth for "this is a user".
 *
 * BelaBlaze no longer renders profile photos, custom avatars, or
 * auto-initial bubbles anywhere in the product. Every place that used
 * to show <img src={user.imageUrl}> or a colored circle with someone's
 * initials now renders this component instead.
 *
 * The visual language is intentionally generic: a neutral ringed disc
 * with the lucide User glyph. This keeps the UI minimal, removes a
 * whole category of upload/CDN/Clerk-image plumbing, and gives every
 * surface a consistent identity primitive.
 *
 * Sizes match the previous Avatar component so call-sites swap 1:1.
 * ────────────────────────────────────────────────────────────────────── */

interface Props {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Subtle brand-tinted variant — for the active user in headers. */
  tone?: "neutral" | "brand";
}

const DIM: Record<NonNullable<Props["size"]>, { box: string; icon: string }> = {
  xs: { box: "w-6 h-6",  icon: "w-3 h-3"    },
  sm: { box: "w-8 h-8",  icon: "w-3.5 h-3.5"},
  md: { box: "w-9 h-9",  icon: "w-4 h-4"    },
  lg: { box: "w-10 h-10", icon: "w-4 h-4"   },
};

export function UserIcon({ size = "sm", tone = "neutral", className }: Props) {
  const d = DIM[size];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full flex-shrink-0 ring-1",
        tone === "brand"
          ? "bg-[#B8EB23]/10 text-[#B8EB23] ring-[#B8EB23]/20"
          : "bg-white/[0.05] text-white/55 ring-white/[0.08]",
        d.box,
        className,
      )}
      aria-hidden="true"
    >
      <User className={d.icon} strokeWidth={1.8} />
    </span>
  );
}
