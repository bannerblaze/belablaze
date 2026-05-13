"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  User, MapPin, Globe, CheckCircle2, ChevronLeft, ChevronRight,
  Image as ImageIcon, Sparkles, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { variants } from "@/lib/motion";
import { completeCreatorOnboarding, type CreatorOnboardingInput } from "@/actions/onboarding";

const STEPS = ["Identidad", "Redes Sociales", "Confirmar"];

const CATEGORIES = ["Lifestyle", "Moda", "Música", "Deportes", "Gaming", "Tech", "Comedia", "Educación", "Belleza", "Comida", "Viajes", "Otro"];
const COUNTRIES = ["Colombia", "México", "Argentina", "Chile", "Perú", "Ecuador", "España", "Otro"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all",
            i < current ? "bg-[#B8EB23] text-black" :
            i === current ? "bg-[#B8EB23]/20 text-[#B8EB23] border border-[#B8EB23]/40" :
            "bg-white/[0.06] text-white/30"
          )}>
            {i < current ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={cn(
            "text-xs font-medium hidden sm:inline",
            i === current ? "text-white" : i < current ? "text-[#B8EB23]" : "text-white/30"
          )}>
            {step}
          </span>
          {i < STEPS.length - 1 && (
            <div className={cn("w-6 h-px mx-1", i < current ? "bg-[#B8EB23]/40" : "bg-white/[0.08]")} />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({ label, error, icon, children }: { label: string; error?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputCls = "w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 transition-all";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82a4.36 4.36 0 0 1-1.07-2.82H12.4v12.65a2.65 2.65 0 1 1-2.65-2.65c.27 0 .54.04.79.12V9.94a5.78 5.78 0 0 0-.79-.05A5.7 5.7 0 1 0 15.45 15.6V9.34a7.49 7.49 0 0 0 4.39 1.4V7.6a4.42 4.42 0 0 1-3.24-1.78z"/>
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

export function CreatorOnboardingWizard({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm<CreatorOnboardingInput>({
    defaultValues: {
      displayName: initialName, category: "", country: "Colombia", city: "",
      instagram: "", tiktok: "", youtube: "", website: "", avatarUrl: "",
    },
  });
  const values = watch();

  const next = async () => {
    const ok = await trigger(
      step === 0 ? ["displayName", "country"] : []
    );
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = (data: CreatorOnboardingInput) => {
    startTransition(async () => {
      const res = await completeCreatorOnboarding(data);
      if (res.ok) {
        toast.brand("¡Perfil de creador listo! Bienvenido.");
        router.replace("/dashboard");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-10 max-w-[720px] mx-auto">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/onboarding" className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          Cambiar tipo
        </Link>
        <StepIndicator current={step} />
      </div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] text-white/80 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Configura tu perfil</h1>
            <p className="text-xs text-white/40 mt-0.5">Cuéntanos quién eres</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-[#0F0F0F]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 sm:p-7 shadow-premium">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step-0" variants={variants.slideRight} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <Field label="Nombre artístico / Display name" icon={<User className="w-3 h-3" />} error={errors.displayName?.message}>
                  <input
                    {...register("displayName", { required: "Requerido", minLength: { value: 2, message: "Mínimo 2 caracteres" } })}
                    placeholder="Cómo quieres que te conozcan"
                    className={inputCls}
                  />
                </Field>
                <Field label="Categoría" icon={<Hash className="w-3 h-3" />}>
                  <select {...register("category")} className={inputCls}>
                    <option value="" className="bg-[#1a1a1a]">Selecciona…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#1a1a1a]">{c}</option>)}
                  </select>
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="País" icon={<Globe className="w-3 h-3" />} error={errors.country?.message}>
                    <select {...register("country", { required: "Selecciona un país" })} className={inputCls}>
                      {COUNTRIES.map((c) => <option key={c} value={c} className="bg-[#1a1a1a]">{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Ciudad" icon={<MapPin className="w-3 h-3" />}>
                    <input {...register("city")} placeholder="Tu ciudad" className={inputCls} />
                  </Field>
                </div>
                <Field label="URL de tu avatar (opcional)" icon={<ImageIcon className="w-3 h-3" />}>
                  <input {...register("avatarUrl")} placeholder="https://…/foto.jpg" className={inputCls} />
                </Field>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step-1" variants={variants.slideRight} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <p className="text-xs text-white/40 -mt-1">Conecta tus redes para potenciar el análisis de tus campañas.</p>
                <Field label="Instagram" icon={<InstagramIcon className="w-3 h-3" />}>
                  <input {...register("instagram")} placeholder="@usuario o link" className={inputCls} />
                </Field>
                <Field label="TikTok" icon={<TikTokIcon className="w-3 h-3" />}>
                  <input {...register("tiktok")} placeholder="@usuario o link" className={inputCls} />
                </Field>
                <Field label="YouTube" icon={<YoutubeIcon className="w-3 h-3" />}>
                  <input {...register("youtube")} placeholder="@canal o link" className={inputCls} />
                </Field>
                <Field label="Sitio web personal" icon={<Globe className="w-3 h-3" />}>
                  <input {...register("website")} placeholder="https://…" className={inputCls} />
                </Field>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step-2" variants={variants.fadeUp} initial="initial" animate="animate" exit="exit">
                <div className="rounded-xl bg-[#B8EB23]/[0.04] border border-[#B8EB23]/15 p-4 mb-5 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#B8EB23] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">¡Listo para entrar!</p>
                    <p className="text-[12px] text-white/45 mt-0.5 leading-relaxed">Revisa tu perfil. Puedes editarlo en cualquier momento desde Configuración.</p>
                  </div>
                </div>
                <dl className="divide-y divide-white/[0.04]">
                  {([
                    ["Nombre", values.displayName],
                    ["Categoría", values.category],
                    ["País", values.country],
                    ["Ciudad", values.city],
                    ["Instagram", values.instagram],
                    ["TikTok", values.tiktok],
                    ["YouTube", values.youtube],
                    ["Web", values.website],
                  ] as const).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-2.5 gap-4">
                      <dt className="text-xs text-white/40">{k}</dt>
                      <dd className="text-xs font-medium text-white text-right truncate max-w-[60%]">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-white/[0.06]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => (step === 0 ? router.push("/onboarding") : setStep((s) => s - 1))}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              {step === 0 ? "Volver" : "Atrás"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" variant="brand" size="sm" onClick={next}>
                Siguiente <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button type="submit" variant="brand" size="sm" loading={isPending} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Confirmar y entrar
              </Button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
