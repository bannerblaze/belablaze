"use client";

import { motion } from "framer-motion";
import { MonitorPlay, Layers, BarChart3, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/* Right-column brand hero shown on /sign-in, /sign-up, /forgot-password.
 *
 * Hidden on mobile (< lg). On desktop, sits beside the form card and
 * gives the auth experience a true "branded landing" feel — eyebrow,
 * massive wordmark, supporting copy, four micro-feature pills. */

const FEATURES = [
  { icon: MonitorPlay, label: "Pantallas",  sub: "en tiempo real" },
  { icon: Layers,      label: "Campañas",   sub: "inteligentes" },
  { icon: BarChart3,   label: "Analytics",  sub: "avanzados" },
  { icon: ShieldCheck, label: "Seguridad",  sub: "empresarial" },
];

interface Props {
  className?: string;
}

export function AuthBrandPanel({ className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      className={cn("relative max-w-[520px]", className)}
    >
      {/* Eyebrow */}
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B8EB23]/85 mb-5">
        Bienvenido a
      </p>

      {/* Wordmark — the visual anchor */}
      <h2 className="text-[56px] lg:text-[72px] font-black tracking-[-0.04em] leading-[0.95] text-white">
        Bela<span className="text-[#B8EB23]">Blaze</span>
      </h2>
      <p className="text-sm font-medium text-white/45 mt-2">
        By BannerBlaze
      </p>

      {/* Brand accent line */}
      <div className="h-px w-12 bg-gradient-to-r from-[#B8EB23] to-transparent mt-7 mb-7" />

      {/* Tagline */}
      <h3 className="text-xl lg:text-[22px] font-semibold text-white tracking-tight leading-snug">
        Tu centro de control de anuncios DOOH.
      </h3>
      <p className="text-[15px] text-white/55 mt-3 leading-relaxed max-w-[460px]">
        Gestiona campañas, pantallas y métricas en tiempo real desde una sola plataforma.
      </p>

      {/* Feature pills — 4 across on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
        {FEATURES.map(({ icon: Icon, label, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 + i * 0.06, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-start gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#B8EB23]/[0.08] ring-1 ring-[#B8EB23]/15 flex items-center justify-center text-[#B8EB23] transition-all duration-200 group-hover:bg-[#B8EB23]/[0.12] group-hover:ring-[#B8EB23]/25 group-hover:shadow-[0_0_24px_-6px_rgba(184,235,35,0.4)]">
              <Icon className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div className="leading-tight">
              <p className="text-[12px] font-semibold text-white">{label}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
