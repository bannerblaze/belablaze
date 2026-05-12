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
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-white text-black hover:bg-white/90",
    brand: "bg-[#B8EB23] text-black hover:bg-[#D4F564] shadow-[0_0_20px_rgba(184,235,35,0.25)] hover:shadow-[0_0_30px_rgba(184,235,35,0.4)]",
    secondary: "bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.08]",
    outline: "bg-transparent text-white/70 hover:text-white border border-white/[0.1] hover:border-white/20 hover:bg-white/[0.04]",
    ghost: "bg-transparent text-white/60 hover:text-white hover:bg-white/[0.06]",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg h-7",
    md: "px-4 py-2 text-sm gap-2 rounded-lg h-9",
    lg: "px-5 py-2.5 text-sm gap-2 rounded-xl h-11",
    icon: "w-9 h-9 rounded-lg",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none",
        variants[variant],
        sizes[size],
        className
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
