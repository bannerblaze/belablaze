"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  Building2, MapPin, Phone, Globe, CheckCircle2, ChevronLeft,
  ChevronRight, Briefcase, User, Hash, Image as ImageIcon, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { variants } from "@/lib/motion";
import { completeCompanyOnboarding, type CompanyOnboardingInput } from "@/actions/onboarding";

const STEPS = ["Identidad", "Ubicación & Contacto", "Confirmar"];

const INDUSTRIES = ["Retail", "Bebidas", "Alimentos", "Fintech", "Telecomunicaciones", "Tecnología", "Salud", "Automotriz", "Entretenimiento", "Otro"];
const SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1000", "1000+"];
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

export function CompanyOnboardingWizard({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm<CompanyOnboardingInput>({
    defaultValues: {
      companyName: "", nit: "", industry: "", companySize: "", website: "",
      country: "Colombia", city: "", logoUrl: "",
      contactName: initialName, contactPhone: "",
    },
  });
  const values = watch();

  const next = async () => {
    const ok = await trigger(
      step === 0 ? ["companyName"] :
      step === 1 ? ["country"] : []
    );
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = (data: CompanyOnboardingInput) => {
    startTransition(async () => {
      const res = await completeCompanyOnboarding(data);
      if (res.ok) {
        toast.brand("¡Listo! Tu cuenta de empresa está configurada.");
        router.replace("/dashboard");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-10 max-w-[760px] mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/onboarding" className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          Cambiar tipo
        </Link>
        <StepIndicator current={step} />
      </div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#B8EB23]/15 text-[#B8EB23] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Configura tu empresa</h1>
            <p className="text-xs text-white/40 mt-0.5">Tomará menos de un minuto</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-[#0F0F0F]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 sm:p-7 shadow-premium">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step-0" variants={variants.slideRight} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre de la empresa" icon={<Building2 className="w-3 h-3" />} error={errors.companyName?.message}>
                    <input
                      {...register("companyName", { required: "Requerido", minLength: { value: 2, message: "Mínimo 2 caracteres" } })}
                      placeholder="Ej: BannerBlaze S.A.S."
                      className={inputCls}
                    />
                  </Field>
                  <Field label="NIT / Tax ID" icon={<Hash className="w-3 h-3" />}>
                    <input {...register("nit")} placeholder="900.123.456-7" className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Industria" icon={<Briefcase className="w-3 h-3" />}>
                    <select {...register("industry")} className={inputCls}>
                      <option value="" className="bg-[#1a1a1a]">Selecciona…</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i} className="bg-[#1a1a1a]">{i}</option>)}
                    </select>
                  </Field>
                  <Field label="Tamaño de la empresa">
                    <select {...register("companySize")} className={inputCls}>
                      <option value="" className="bg-[#1a1a1a]">Selecciona…</option>
                      {SIZES.map((s) => <option key={s} value={s} className="bg-[#1a1a1a]">{s} empleados</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Sitio web" icon={<Globe className="w-3 h-3" />}>
                  <input {...register("website")} placeholder="https://tuempresa.com" className={inputCls} />
                </Field>
                <Field label="URL del logo (opcional)" icon={<ImageIcon className="w-3 h-3" />}>
                  <input {...register("logoUrl")} placeholder="https://…/logo.png" className={inputCls} />
                </Field>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step-1" variants={variants.slideRight} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="País" icon={<Globe className="w-3 h-3" />} error={errors.country?.message}>
                    <select {...register("country", { required: "Selecciona un país" })} className={inputCls}>
                      {COUNTRIES.map((c) => <option key={c} value={c} className="bg-[#1a1a1a]">{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Ciudad" icon={<MapPin className="w-3 h-3" />}>
                    <input {...register("city")} placeholder="Medellín, Bogotá…" className={inputCls} />
                  </Field>
                </div>
                <div className="pt-2 border-t border-white/[0.06]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Contacto principal</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nombre del contacto" icon={<User className="w-3 h-3" />}>
                      <input {...register("contactName")} placeholder="Tu nombre" className={inputCls} />
                    </Field>
                    <Field label="Teléfono" icon={<Phone className="w-3 h-3" />}>
                      <input {...register("contactPhone")} placeholder="+57 300 000 0000" className={inputCls} />
                    </Field>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step-2" variants={variants.fadeUp} initial="initial" animate="animate" exit="exit">
                <div className="rounded-xl bg-[#B8EB23]/[0.04] border border-[#B8EB23]/15 p-4 mb-5 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#B8EB23] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">¡Casi listo!</p>
                    <p className="text-[12px] text-white/45 mt-0.5 leading-relaxed">Revisa la información antes de confirmar. Podrás editarla luego desde Configuración.</p>
                  </div>
                </div>
                <dl className="divide-y divide-white/[0.04]">
                  {([
                    ["Empresa", values.companyName],
                    ["NIT", values.nit],
                    ["Industria", values.industry],
                    ["Tamaño", values.companySize && `${values.companySize} empleados`],
                    ["Web", values.website],
                    ["País", values.country],
                    ["Ciudad", values.city],
                    ["Contacto", values.contactName],
                    ["Teléfono", values.contactPhone],
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

          {/* Footer */}
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
