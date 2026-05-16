import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  brand?: boolean;
  elevated?: boolean;
}

export function Card({
  children, className,
  hover = false, glass = false, brand = false, elevated = false,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border",
        glass
          ? "bg-white/[0.02] border-white/[0.06] backdrop-blur-md"
          : brand
          ? "bg-[#B8EB23]/[0.04] border-[#B8EB23]/[0.15]"
          : "bg-[#0E0E10] border-white/[0.06]",
        elevated && "shadow-elevated",
        hover && "transition-all duration-200 cursor-pointer hover:border-white/[0.12] hover:bg-[#16161A]",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, icon, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 p-5 pb-0", className)}>
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/65">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white leading-none tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-white/40 mt-1.5 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function CardDivider() {
  return <div className="border-t border-white/[0.05] mx-5" />;
}
