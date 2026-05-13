"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  ShieldAlert, ShieldCheck, KeyRound, Mail, Lock, AlertTriangle,
  CheckCircle2, ChevronLeft, ChevronRight, User, Briefcase, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { variants } from "@/lib/motion";
import {
  verifyAdminAccess,
  completeAdminOnboarding,
  type AdminOnboardingInput,
} from "@/actions/onboarding";

const STEPS = ["Email", "Código", "Perfil", "Confirmar"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all",
            i < current ? "bg-red-500 text-black" :
            i === current ? "bg-red-500/20 text-red-400 border border-red-500/40" :
            "bg-white/[0.06] text-white/30"
          )}>
            {i < current ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={cn(
            "text-xs font-medium hidden sm:inline",
            i === current ? "text-white" : i < current ? "text-red-400" : "text-white/30"
          )}>
            {step}
          </span>
          {i < STEPS.length - 1 && (
            <div className={cn("w-6 h-px mx-1", i < current ? "bg-red-500/40" : "bg-white/[0.08]")} />
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

const inputCls = "w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/40 transition-all";

type ServerError = { message: string; resetAt?: string };

export function AdminOnboardingWizard({ initialEmail, initialName }: { initialEmail: string; initialName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [unlocked, setUnlocked] = useState(false);
  const [serverError, setServerError] = useState<ServerError | null>(null);

  const { register, handleSubmit, watch, formState: { errors }, trigger, getValues } = useForm<AdminOnboardingInput>({
    defaultValues: { email: initialEmail, code: "", name: initialName, position: "" },
  });
  const values = watch();

  // Step 0 → 1: validate email (don't call server yet — that's step 1)
  const advanceFromEmail = async () => {
    const ok = await trigger(["email"]);
    if (ok) {
      setServerError(null);
      setStep(1);
    }
  };

  // Step 1 → 2: server-validate code + whitelist + rate limit
  const advanceFromCode = () => {
    startTransition(async () => {
      setServerError(null);
      const res = await verifyAdminAccess({ email: getValues("email"), code: getValues("code") });
      if (res.ok) {
        setUnlocked(true);
        toast.brand("Acceso desbloqueado. Completa tu perfil.");
        setStep(2);
      } else {
        setServerError({ message: res.error });
        if (res.code === "rate_limited") {
          toast.error("Demasiados intentos. Espera unos minutos.");
        } else {
          toast.error(res.error);
        }
      }
    });
  };

  // Step 2 → 3: validate profile fields client-side
  const advanceFromProfile = async () => {
    const ok = await trigger(["name"]);
    if (ok) setStep(3);
  };

  const onSubmit = (data: AdminOnboardingInput) => {
    startTransition(async () => {
      const res = await completeAdminOnboarding(data);
      if (res.ok) {
        toast.brand("Bienvenido, administrador.");
        router.replace("/dashboard");
      } else {
        setServerError({ message: res.error });
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-10 max-w-[680px] mx-auto">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/onboarding" className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          Cambiar tipo
        </Link>
        <StepIndicator current={step} />
      </div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            animate={unlocked ? { backgroundColor: "rgba(184,235,35,0.15)", color: "#B8EB23" } : {}}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center"
          >
            {unlocked ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Acceso administrativo</h1>
            <p className="text-xs text-white/40 mt-0.5">Verificación requerida · Sólo personal autorizado</p>
          </div>
        </div>

        {/* Security disclaimer */}
        <div className="mb-5 flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/[0.04] border border-red-500/15">
          <Lock className="w-3.5 h-3.5 text-red-400/80 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-red-400/80 leading-relaxed">
            Todos los intentos son registrados y notificados al equipo de seguridad de BannerBlaze.
            Tu IP y user-agent quedarán auditados.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className={cn(
            "bg-[#0F0F0F]/80 backdrop-blur-xl border rounded-2xl p-5 sm:p-7 shadow-premium transition-colors",
            unlocked ? "border-[#B8EB23]/20" : "border-red-500/15"
          )}
        >
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step-0" variants={variants.slideRight} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <Field label="Correo autorizado" icon={<Mail className="w-3 h-3" />} error={errors.email?.message}>
                  <input
                    {...register("email", {
                      required: "Ingresa tu correo",
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email inválido" },
                    })}
                    placeholder="tu-correo@bannerblaze.com"
                    className={inputCls}
                    autoComplete="email"
                  />
                </Field>
                <p className="text-[11px] text-white/30 leading-relaxed">
                  Sólo correos previamente autorizados pueden continuar. Si tu correo no está en la whitelist, el sistema rechazará el siguiente paso.
                </p>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step-1" variants={variants.slideRight} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <Field label="Código de acceso interno" icon={<KeyRound className="w-3 h-3" />} error={errors.code?.message}>
                  <input
                    {...register("code", { required: "Ingresa el código" })}
                    type="password"
                    placeholder="••••••••••••"
                    className={cn(inputCls, "tracking-[0.4em] font-mono")}
                    autoComplete="off"
                    autoFocus
                  />
                </Field>
                <p className="text-[11px] text-white/30 leading-relaxed">
                  Solicita el código al equipo administrativo. Tienes 5 intentos en 15 minutos antes del bloqueo temporal.
                </p>
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-400">{serverError.message}</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step-2" variants={variants.slideRight} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <div className="rounded-xl bg-[#B8EB23]/[0.05] border border-[#B8EB23]/20 p-3.5 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#B8EB23] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">Acceso verificado</p>
                    <p className="text-[12px] text-white/45 mt-0.5">Completa tu perfil para finalizar.</p>
                  </div>
                </div>
                <Field label="Nombre completo" icon={<User className="w-3 h-3" />} error={errors.name?.message}>
                  <input
                    {...register("name", { required: "Requerido", minLength: { value: 2, message: "Mínimo 2 caracteres" } })}
                    placeholder="Nombre y apellido"
                    className={inputCls}
                  />
                </Field>
                <Field label="Cargo / Position" icon={<Briefcase className="w-3 h-3" />}>
                  <input {...register("position")} placeholder="Ej: CEO, Head of Ops" className={inputCls} />
                </Field>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step-3" variants={variants.fadeUp} initial="initial" animate="animate" exit="exit">
                <div className="rounded-xl bg-[#B8EB23]/[0.05] border border-[#B8EB23]/15 p-4 mb-5 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#B8EB23] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">Confirma tu acceso administrativo</p>
                    <p className="text-[12px] text-white/45 mt-0.5 leading-relaxed">
                      Al confirmar, recibirás permisos completos sobre la plataforma BannerBlaze.
                    </p>
                  </div>
                </div>
                <dl className="divide-y divide-white/[0.04]">
                  {([
                    ["Email", values.email],
                    ["Nombre", values.name],
                    ["Cargo", values.position],
                    ["Rol", "ADMIN"],
                  ] as const).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-2.5 gap-4">
                      <dt className="text-xs text-white/40">{k}</dt>
                      <dd className="text-xs font-medium text-white text-right truncate max-w-[60%]">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
                {serverError && (
                  <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-400">{serverError.message}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-white/[0.06]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setServerError(null);
                if (step === 0) router.push("/onboarding");
                else setStep((s) => s - 1);
              }}
              disabled={isPending}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              {step === 0 ? "Volver" : "Atrás"}
            </Button>
            {step === 0 && (
              <Button type="button" variant="brand" size="sm" onClick={advanceFromEmail}>
                Continuar <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
            {step === 1 && (
              <Button type="button" variant="brand" size="sm" loading={isPending} onClick={advanceFromCode} icon={<KeyRound className="w-3.5 h-3.5" />}>
                Verificar código
              </Button>
            )}
            {step === 2 && (
              <Button type="button" variant="brand" size="sm" onClick={advanceFromProfile}>
                Siguiente <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
            {step === 3 && (
              <Button type="submit" variant="brand" size="sm" loading={isPending} icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                Confirmar acceso ADMIN
              </Button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
