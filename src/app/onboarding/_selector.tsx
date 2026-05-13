"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, User, ShieldAlert, ArrowRight, Zap, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { variants, staggerContainer } from "@/lib/motion";

type CardSpec = {
  id: string;
  href: string;
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  variant: "brand" | "neutral" | "danger";
  badge?: string;
};

const CARDS: CardSpec[] = [
  {
    id: "company",
    href: "/onboarding/company",
    title: "Empresa u Organización",
    description: "Para empresas, agencias, fundaciones y marcas comerciales.",
    features: ["Campañas y anuncios", "Pantallas asignadas", "Métricas + QR analytics"],
    icon: <Building2 className="w-6 h-6" />,
    variant: "brand",
  },
  {
    id: "creator",
    href: "/onboarding/creator",
    title: "Persona o Marca Personal",
    description: "Para influencers, artistas, celebridades y marcas personales.",
    features: ["Campañas personales", "Engagement + QR", "Analytics básicos"],
    icon: <User className="w-6 h-6" />,
    variant: "neutral",
  },
  {
    id: "admin",
    href: "/onboarding/admin",
    title: "Administrador BannerBlaze",
    description: "Acceso interno exclusivo para ejecutivos y administradores.",
    features: ["Sólo para personal autorizado", "Requiere whitelist + código", "Acceso completo a la plataforma"],
    icon: <ShieldAlert className="w-6 h-6" />,
    variant: "danger",
    badge: "Restringido",
  },
];

export function OnboardingSelector({ userEmail }: { userEmail: string }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12 lg:py-16 mx-auto max-w-[1100px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10 lg:mb-14"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-5">
          <Zap className="w-3 h-3 text-[#B8EB23]" />
          <span className="text-[10px] font-semibold tracking-widest uppercase text-white/60">
            BannerBlaze · Onboarding
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3">
          ¿Qué tipo de cuenta deseas crear?
        </h1>
        <p className="text-sm sm:text-base text-white/45 max-w-xl mx-auto leading-relaxed">
          Configuraremos tu plataforma según el perfil que selecciones. Podrás cambiar la información más tarde desde Configuración.
        </p>
        <p className="text-[11px] text-white/25 mt-4">
          Iniciaste sesión como <span className="text-white/50 font-medium">{userEmail}</span>
        </p>
      </motion.div>

      {/* Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5"
      >
        {CARDS.map((card) => (
          <motion.div key={card.id} variants={variants.fadeUp}>
            <Link
              href={card.href}
              className={cn(
                "group relative flex flex-col h-full p-6 rounded-2xl border transition-all duration-300 overflow-hidden",
                card.variant === "brand" &&
                  "bg-[#B8EB23]/[0.04] border-[#B8EB23]/20 hover:border-[#B8EB23]/45 hover:bg-[#B8EB23]/[0.07] hover:shadow-[0_0_40px_rgba(184,235,35,0.12)]",
                card.variant === "neutral" &&
                  "bg-[#111111] border-white/[0.08] hover:border-white/20 hover:bg-[#161616]",
                card.variant === "danger" &&
                  "bg-red-500/[0.03] border-red-500/20 hover:border-red-500/40 hover:shadow-[0_0_40px_rgba(239,68,68,0.08)]"
              )}
            >
              {/* Badge */}
              {card.badge && (
                <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30">
                  <Lock className="w-2.5 h-2.5 text-red-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">{card.badge}</span>
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-5 flex-shrink-0 transition-all duration-300",
                  card.variant === "brand" &&
                    "bg-[#B8EB23]/15 text-[#B8EB23] group-hover:bg-[#B8EB23]/25",
                  card.variant === "neutral" &&
                    "bg-white/[0.06] text-white/70 group-hover:bg-white/[0.1]",
                  card.variant === "danger" &&
                    "bg-red-500/15 text-red-400 group-hover:bg-red-500/25"
                )}
              >
                {card.icon}
              </div>

              {/* Title + description */}
              <h3 className="text-base font-semibold text-white leading-tight mb-1.5">{card.title}</h3>
              <p className="text-[13px] text-white/45 leading-relaxed mb-5">{card.description}</p>

              {/* Feature list */}
              <ul className="space-y-1.5 mb-6 flex-1">
                {card.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[12px] text-white/55">
                    <Sparkles
                      className={cn(
                        "w-3 h-3 mt-0.5 flex-shrink-0",
                        card.variant === "brand" && "text-[#B8EB23]/70",
                        card.variant === "neutral" && "text-white/35",
                        card.variant === "danger" && "text-red-400/70"
                      )}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div
                className={cn(
                  "flex items-center justify-between mt-auto pt-4 border-t",
                  card.variant === "brand" && "border-[#B8EB23]/15",
                  card.variant === "neutral" && "border-white/[0.06]",
                  card.variant === "danger" && "border-red-500/15"
                )}
              >
                <span
                  className={cn(
                    "text-[12px] font-semibold",
                    card.variant === "brand" && "text-[#B8EB23]",
                    card.variant === "neutral" && "text-white",
                    card.variant === "danger" && "text-red-400"
                  )}
                >
                  Continuar
                </span>
                <ArrowRight
                  className={cn(
                    "w-4 h-4 transition-transform duration-300 group-hover:translate-x-1",
                    card.variant === "brand" && "text-[#B8EB23]",
                    card.variant === "neutral" && "text-white",
                    card.variant === "danger" && "text-red-400"
                  )}
                />
              </div>

              {/* Hover gradient overlay (danger card) */}
              {card.variant === "danger" && (
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] via-transparent to-[#B8EB23]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
                />
              )}
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Security disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="text-[11px] text-white/25 text-center mt-8 max-w-md mx-auto leading-relaxed"
      >
        <Lock className="w-3 h-3 inline-block mr-1 -mt-0.5" />
        El acceso administrativo requiere autorización previa por parte del equipo de BannerBlaze.
      </motion.p>
    </div>
  );
}
