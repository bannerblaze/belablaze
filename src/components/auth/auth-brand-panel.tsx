"use client";

import { motion } from "framer-motion";
import { MonitorPlay, Layers, BarChart3, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/* Brand hero — shown on /sign-in, /sign-up, /forgot-password.
 *
 * Mobile  (< lg): centered, smaller wordmark, 2×2 feature grid
 * Desktop (≥ lg): left-aligned, massive wordmark, 4-col feature grid
 *
 * Sits flush on the dark canvas (no card / no background) so it
 * blends with the cinematic ambient glow instead of competing with
 * the glass form card. */

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
      className={cn(
        "relative w-full max-w-[520px]",
        "text-center lg:text-left",
        className,
      )}
    >
      {/* Logo + Eyebrow */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3 lg:gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#B8EB23] shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_0_32px_-2px_rgba(184,235,35,0.5)] lg:hidden">
          <Zap className="w-6 h-6 text-black" strokeWidth={2.5} />
        </div>
        <div className="lg:flex lg:flex-col">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B8EB23]/90">
            Bienvenido a
          </p>
        </div>
      </div>

      {/* Wordmark — visual anchor */}
      <h2 className="text-[44px] sm:text-[56px] lg:text-[72px] font-black tracking-[-0.04em] leading-[0.95] text-white mt-4 lg:mt-5">
        Bela<span className="text-[#B8EB23]">Blaze</span>
      </h2>
      <p className="text-sm font-medium text-white/45 mt-2.5">
        By BannerBlaze
      </p>

      {/* Brand accent line — centered on mobile, left on desktop */}
      <div className="h-px w-16 bg-gradient-to-r from-[#B8EB23] to-transparent mt-6 lg:mt-7 mb-6 lg:mb-7 mx-auto lg:mx-0" />

      {/* Tagline */}
      <h3 className="text-lg lg:text-[22px] font-semibold text-white tracking-tight leading-snug">
        Tu centro de control de anuncios DOOH.
      </h3>
      <p className="text-[13px] lg:text-[15px] text-white/55 mt-3 leading-relaxed max-w-[460px] mx-auto lg:mx-0">
        Gestiona campañas, pantallas y métricas en tiempo real desde una sola plataforma.
      </p>

      {/* Feature pills — 2×2 mobile, 4-col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 lg:mt-10 max-w-[440px] lg:max-w-none mx-auto lg:mx-0">
        {FEATURES.map(({ icon: Icon, label, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 + i * 0.06, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center lg:items-start gap-2.5 group"
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
