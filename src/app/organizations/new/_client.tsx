"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  Building2, Globe, Briefcase, Hash, Image as ImageIcon,
  CheckCircle2, ChevronLeft, ChevronRight, Sparkles, MapPin, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { variants } from "@/lib/motion";
import { createOrganization } from "@/actions/organizations";

const STEPS = ["Identidad", "Detalles", "Confirmar"];

const INDUSTRIES = [
  "Retail", "Bebidas", "Alimentos", "Fintech",
  "Telecomunicaciones", "Tecnología", "Salud", "Automotriz",
  "Entretenimiento", "Otro",
];
const SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1000", "1000+"];
const COUNTRIES = ["Colombia", "México", "Argentina", "Chile", "Perú", "Ecuador", "España", "Otro"];

type FormValues = {
  name: string;
  slug: string;
  website: string;
  industry: string;
  size: string;
  country: string;
  city: string;
  logoUrl: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 transition-all";

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all",
              i < current ? "bg-[#B8EB23] text-black" :
              i === current ? "bg-[#B8EB23]/20 text-[#B8EB23] border border-[#B8EB23]/40" :
              "bg-white/[0.06] text-white/30",
            )}
          >
            {i < current ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span
            className={cn(
              "text-xs font-medium hidden sm:inline",
              i === current ? "text-white" : i < current ? "text-[#B8EB23]" : "text-white/30",
            )}
          >
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

function Field({
  label, error, icon, children,
}: { label: string; error?: string; icon?: React.ReactNode; children: React.ReactNode }) {
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

interface Props {
  initialContactName: string;
}

export function NewOrganizationWizard({ initialContactName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm<FormValues>({
    defaultValues: {
      name: "",
      slug: "",
      website: "",
      industry: "",
      size: "",
      country: "Colombia",
      city: "",
      logoUrl: "",
    },
  });

  const values = watch();

  // Auto-suggest slug from name until the user edits it manually.
  useEffect(() => {
    if (slugTouched) return;
    const next = slugify(values.name);
    if (next !== values.slug) setValue("slug", next);
  }, [values.name, values.slug, slugTouched, setValue]);

  const nextStep = async () => {
    let valid = true;
    if (step === 0) {
      valid = await trigger(["name", "industry", "size"]);
    } else if (step === 1) {
      valid = await trigger(["country"]);
    }
    if (valid) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const res = await createOrganization({
        name: data.name.trim(),
        slug: data.slug || undefined,
        website: data.website || undefined,
        industry: data.industry || undefined,
        size: data.size || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Organización "${data.name}" creada`);
      router.replace("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[840px] mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-[11px] text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-3 h-3" />
          Volver al dashboard
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <span className="inline-flex w-9 h-9 rounded-xl bg-[#B8EB23]/10 border border-[#B8EB23]/20 items-center justify-center text-[#B8EB23]">
                <Sparkles className="w-4 h-4" />
              </span>
              Crear nueva organización
            </h1>
            <p className="text-xs text-white/40 mt-1.5 max-w-[520px]">
              Una organización es un espacio de trabajo independiente con su propia configuración,
              equipo, campañas y facturación. {initialContactName ? `Tú, ${initialContactName}, serás el propietario.` : "Tú serás el propietario."}
            </p>
          </div>
          <StepIndicator current={step} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 && (
              <motion.div
                key="step-0"
                variants={variants.fadeUp}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="p-5 sm:p-6 space-y-4"
              >
                <Field label="Nombre" icon={<Building2 className="w-3 h-3" />} error={errors.name?.message}>
                  <input
                    {...register("name", {
                      required: "El nombre es obligatorio",
                      minLength: { value: 2, message: "Mínimo 2 caracteres" },
                    })}
                    placeholder="Acme Inc."
                    className={inputCls}
                    autoFocus
                  />
                </Field>

                <Field label="Slug" icon={<Hash className="w-3 h-3" />} error={errors.slug?.message}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/40 font-mono whitespace-nowrap">
                      belablaze.app /
                    </span>
                    <input
                      {...register("slug", {
                        pattern: { value: /^[a-z0-9-]+$/, message: "Solo minúsculas, números y guiones" },
                        minLength: { value: 2, message: "Mínimo 2 caracteres" },
                        maxLength: { value: 50, message: "Máximo 50 caracteres" },
                      })}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      }}
                      placeholder="acme"
                      className={inputCls}
                    />
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">
                    Identificador único. Lo usamos para URLs internas y exportaciones.
                  </p>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Industria" icon={<Briefcase className="w-3 h-3" />} error={errors.industry?.message}>
                    <div className="flex flex-wrap gap-1.5">
                      {INDUSTRIES.map((opt) => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => setValue("industry", opt, { shouldValidate: true })}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all",
                            values.industry === opt
                              ? "bg-[#B8EB23]/10 text-[#B8EB23] border-[#B8EB23]/30"
                              : "bg-white/[0.02] text-white/60 border-white/[0.06] hover:border-white/[0.12]",
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <input type="hidden" {...register("industry", { required: "Selecciona una industria" })} />
                  </Field>

                  <Field label="Tamaño del equipo" icon={<Users className="w-3 h-3" />} error={errors.size?.message}>
                    <div className="flex flex-wrap gap-1.5">
                      {SIZES.map((opt) => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => setValue("size", opt, { shouldValidate: true })}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all",
                            values.size === opt
                              ? "bg-[#B8EB23]/10 text-[#B8EB23] border-[#B8EB23]/30"
                              : "bg-white/[0.02] text-white/60 border-white/[0.06] hover:border-white/[0.12]",
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <input type="hidden" {...register("size", { required: "Selecciona un tamaño" })} />
                  </Field>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-1"
                variants={variants.fadeUp}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="p-5 sm:p-6 space-y-4"
              >
                <Field label="Sitio web" icon={<Globe className="w-3 h-3" />} error={errors.website?.message}>
                  <input
                    {...register("website", {
                      validate: (v) =>
                        !v || /^https?:\/\/.+\..+/.test(v) || "URL inválida (debe iniciar con https://)",
                    })}
                    placeholder="https://acme.com"
                    className={inputCls}
                  />
                </Field>

                <Field label="Logo (URL)" icon={<ImageIcon className="w-3 h-3" />} error={errors.logoUrl?.message}>
                  <input
                    {...register("logoUrl")}
                    placeholder="https://… (opcional)"
                    className={inputCls}
                  />
                  <p className="text-[10px] text-white/30 mt-1">
                    Podrás cambiarlo luego desde Configuración → Branding.
                  </p>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="País" icon={<MapPin className="w-3 h-3" />} error={errors.country?.message}>
                    <select
                      {...register("country", { required: "Selecciona un país" })}
                      className={inputCls}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c} className="bg-[#111]">{c}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Ciudad" icon={<MapPin className="w-3 h-3" />}>
                    <input
                      {...register("city")}
                      placeholder="Medellín"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                variants={variants.fadeUp}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="p-5 sm:p-6 space-y-4"
              >
                <div className="rounded-xl bg-[#B8EB23]/[0.04] border border-[#B8EB23]/15 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B8EB23] to-[#8FBA10] flex items-center justify-center text-black flex-shrink-0">
                      {values.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={values.logoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{values.name || "Sin nombre"}</p>
                      <p className="text-[11px] text-[#B8EB23] font-mono mt-0.5">
                        belablaze.app/{values.slug || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: "Industria", value: values.industry || "—" },
                    { label: "Tamaño", value: values.size || "—" },
                    { label: "País", value: values.country },
                    { label: "Ciudad", value: values.city || "—" },
                    { label: "Sitio web", value: values.website || "—" },
                    { label: "Plan inicial", value: "STARTER · 14 días de prueba" },
                  ].map((row) => (
                    <div key={row.label} className="space-y-0.5">
                      <p className="text-white/35 text-[10px] uppercase tracking-wider">{row.label}</p>
                      <p className="text-white/80 font-medium truncate">{row.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                    Lo que se creará
                  </p>
                  {[
                    "Tu cuenta queda como propietario (OWNER) de la organización",
                    "Un workspace inicial llamado \"Producción\"",
                    "Una suscripción STARTER en trial por 14 días",
                    "Quedas dentro de la organización automáticamente",
                  ].map((line) => (
                    <div key={line} className="flex items-start gap-2 text-xs text-white/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#B8EB23] flex-shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step controls */}
          <div className="flex items-center justify-between gap-2 px-5 sm:px-6 py-4 border-t border-white/[0.06] bg-black/20">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={step === 0 || isPending}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Atrás
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={nextStep}
                disabled={isPending}
                icon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Continuar
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                {isPending ? "Creando…" : "Crear organización"}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
