"use client";

import { motion } from "framer-motion";
import { Sparkles, Plus, Compass } from "lucide-react";
import { COLOMBIA_OUTLINE, MAP_VIEWBOX } from "@/lib/colombia-geo";

/* Premium empty state for the screens module.
 *
 * Renders the Colombia silhouette as a faint background motif so the
 * page still feels like a fleet console even before the first device
 * is registered — no generic "no data" placeholder. */

interface Props {
  canCreate?: boolean;
  onCreate?: () => void;
}

export function ScreenFleetEmpty({ canCreate = false, onCreate }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl bg-[#0A0A0A] border border-white/[0.06] overflow-hidden"
    >
      {/* Silhouette backdrop */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
        <svg
          viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-[80%] h-[80%]"
        >
          <path d={COLOMBIA_OUTLINE} fill="#B8EB23" />
        </svg>
      </div>

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 30%, rgba(184,235,35,0.08), transparent 60%)",
        }}
      />

      <div className="relative px-8 py-16 sm:py-24 flex flex-col items-center text-center">
        {/* Icon stack */}
        <div className="relative mb-7">
          <div className="absolute inset-0 rounded-3xl bg-[#B8EB23]/15 blur-2xl" />
          <div className="relative w-20 h-20 rounded-3xl bg-[#0F0F0F] border border-[#B8EB23]/30 flex items-center justify-center">
            <Compass className="w-8 h-8 text-[#B8EB23]" strokeWidth={1.5} />
          </div>
          {/* Floating sparkle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="absolute -top-1 -right-1 w-7 h-7 rounded-2xl bg-[#B8EB23] flex items-center justify-center text-black shadow-[0_0_20px_rgba(184,235,35,0.6)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </motion.div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Comienza a construir tu red DOOH
        </h2>
        <p className="mt-3 text-sm text-white/45 max-w-md leading-relaxed">
          Registra tu primera pantalla y desbloquea telemetría en tiempo real,
          mapa operacional, monitoreo de uptime e inventario centralizado.
        </p>

        {/* feature pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-lg">
          {[
            "Mapa interactivo",
            "Telemetría live",
            "Multi-ciudad",
            "Health monitoring",
            "CMS-ready",
          ].map((label) => (
            <span
              key={label}
              className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-semibold text-white/55 uppercase tracking-wider"
            >
              {label}
            </span>
          ))}
        </div>

        {canCreate && (
          <button
            onClick={onCreate}
            className="mt-8 group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B8EB23] text-black text-sm font-bold hover:bg-[#D4F564] transition-all shadow-[0_0_30px_rgba(184,235,35,0.25)] hover:shadow-[0_0_40px_rgba(184,235,35,0.4)]"
          >
            <Plus className="w-4 h-4" />
            Registrar primera pantalla
          </button>
        )}
        {!canCreate && (
          <p className="mt-8 text-[11px] text-white/30 italic">
            Tu rol no permite registrar pantallas — pídele al administrador de tu organización que te otorgue el permiso.
          </p>
        )}
      </div>
    </motion.div>
  );
}
