import { cn, getStatusConfig } from "@/lib/utils";

interface BadgeProps {
  status: string;
  showDot?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, showDot = true, className, size = "md" }: BadgeProps) {
  const config = getStatusConfig(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        config.color,
        config.bg,
        "border-current/10",
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dot)} />}
      {config.label}
    </span>
  );
}

interface GenericBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "brand" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, variant = "default", size = "md", className }: GenericBadgeProps) {
  const variants = {
    default: "bg-white/[0.08] text-white/70 border-white/10",
    brand: "bg-[#B8EB23]/10 text-[#B8EB23] border-[#B8EB23]/20",
    success: "bg-green-400/10 text-green-400 border-green-400/20",
    warning: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    danger: "bg-red-400/10 text-red-400 border-red-400/20",
    info: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    outline: "bg-transparent text-white/50 border-white/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
