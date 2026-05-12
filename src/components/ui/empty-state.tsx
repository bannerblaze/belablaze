"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon, title, description, action, secondaryAction, className, compact,
}: EmptyStateProps) {
  const ActionButton = ({ label, href, onClick, variant = "primary" }: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary";
  }) => {
    const cls = variant === "primary"
      ? "px-4 py-2 rounded-lg bg-[#B8EB23] text-black text-sm font-semibold hover:bg-[#D4F564] transition-all shadow-[0_0_20px_rgba(184,235,35,0.15)]"
      : "px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.06] hover:text-white transition-all";

    if (href) return <Link href={href} className={cls}>{label}</Link>;
    return <button onClick={onClick} className={cls}>{label}</button>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-10 px-6" : "py-20 px-8",
        className
      )}
    >
      {/* Icon container with glow */}
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-2xl bg-[#B8EB23]/5 blur-xl" />
        <div className="relative w-16 h-16 rounded-2xl bg-[#111111] border border-white/[0.08] flex items-center justify-center text-white/25">
          <div className="scale-125">{icon}</div>
        </div>
      </div>

      <h3 className={cn("font-semibold text-white mb-2", compact ? "text-sm" : "text-base")}>
        {title}
      </h3>
      <p className={cn("text-white/40 leading-relaxed max-w-xs", compact ? "text-xs" : "text-sm")}>
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            <ActionButton label={action.label} href={action.href} onClick={action.onClick} variant="primary" />
          )}
          {secondaryAction && (
            <ActionButton label={secondaryAction.label} href={secondaryAction.href} onClick={secondaryAction.onClick} variant="secondary" />
          )}
        </div>
      )}
    </motion.div>
  );
}

// Pre-built empty states for common use cases
export function NoCampaignsEmpty({ onNew }: { onNew?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
        </svg>
      }
      title="No hay campañas aún"
      description="Crea tu primera campaña publicitaria y empieza a gestionar tus anuncios en pantallas DOOH."
      action={{ label: "Crear campaña", href: "/campaigns/new" }}
    />
  );
}

export function NoAdsEmpty({ onNew }: { onNew?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 1 8.835-2.535m0 0A23.74 23.74 0 0 1 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
        </svg>
      }
      title="Sin anuncios todavía"
      description="Sube tu primer anuncio creativo y comienza el proceso de revisión para publicarlo en tus pantallas."
      action={{ label: "Subir anuncio", href: "/ads/new" }}
    />
  );
}

export function NoScreensEmpty() {
  return (
    <EmptyState
      icon={
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
        </svg>
      }
      title="No hay pantallas registradas"
      description="Agrega tus primeras pantallas digitales para comenzar a gestionar el inventario DOOH."
      action={{ label: "Registrar pantalla", href: "/screens/new" }}
    />
  );
}

export function NoClientsEmpty() {
  return (
    <EmptyState
      icon={
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      }
      title="Sin clientes registrados"
      description="Agrega tu primer cliente para comenzar a gestionar sus campañas y presupuestos publicitarios."
      action={{ label: "Agregar cliente", href: "/clients/new" }}
    />
  );
}

export function NoApprovalsEmpty() {
  return (
    <EmptyState
      icon={
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
      }
      title="Todo al día"
      description="No hay anuncios pendientes de revisión en este momento. Cuando lleguen nuevas solicitudes aparecerán aquí."
    />
  );
}

export function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      compact
      icon={
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      }
      title={`Sin resultados para "${query}"`}
      description="Intenta con otros términos de búsqueda o ajusta los filtros aplicados."
    />
  );
}
