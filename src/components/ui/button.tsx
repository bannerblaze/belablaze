import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "brand";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  className,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-white text-black hover:bg-white/90 active:bg-white/80",
    brand:
      "bg-[#B8EB23] text-black font-semibold hover:bg-[#C5F034] active:bg-[#A5D820] " +
      "shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_0_24px_-4px_rgba(184,235,35,0.35)] " +
      "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_0_32px_-2px_rgba(184,235,35,0.5)]",
    secondary:
      "bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.14] active:bg-white/[0.05]",
    outline:
      "bg-transparent text-white/75 hover:text-white border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.03] active:bg-white/[0.05]",
    ghost:
      "bg-transparent text-white/60 hover:text-white hover:bg-white/[0.05] active:bg-white/[0.08]",
    danger:
      "bg-red-500/10 text-red-300 hover:bg-red-500/[0.18] border border-red-500/[0.2] hover:border-red-500/[0.32]",
  };

  const sizes = {
    sm:   "px-2.5 py-1   text-xs  gap-1.5 rounded-md  h-7",
    md:   "px-3.5 py-2   text-sm  gap-1.5 rounded-lg  h-9",
    lg:   "px-5   py-2.5 text-sm  gap-2   rounded-lg  h-11",
    icon: "w-9 h-9 rounded-lg",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8EB23]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070708]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {size !== "icon" && children}
      {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
}
