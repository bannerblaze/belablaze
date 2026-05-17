"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Loader2, AlertCircle, KeyRound, Eye, EyeOff, CheckCircle2, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "email" | "code" | "password" | "done";

const STEPS = ["email", "code", "password"] as const;

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className={cn(
        "w-2 h-2 rounded-full transition-all duration-300",
        done ? "bg-[#B8EB23]" : active ? "bg-[#B8EB23]/60" : "bg-white/[0.12]"
      )}
    />
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  error?: string;
  right?: React.ReactNode;
}

function Field({ label, icon, error, right, ...props }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold text-white/55 flex items-center gap-1.5 tracking-wide">
        {icon}
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          className={cn(
            "w-full h-11 px-3.5 rounded-xl bg-white/[0.03] border text-sm text-white placeholder-white/25 focus:outline-none transition-all duration-150",
            right ? "pr-10" : "",
            error
              ? "border-red-400/40 focus:border-red-400/60 focus:shadow-[0_0_0_3px_rgba(248,113,113,0.12)]"
              : "border-white/[0.08] focus:border-[#B8EB23]/45 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(184,235,35,0.12)]",
          )}
        />
        {right && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
        )}
      </div>
      {error && (
        <p className="text-[11px] text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export function ForgotPasswordForm() {
  const { signIn } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stepIndex = STEPS.indexOf(step as (typeof STEPS)[number]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !email.trim()) { setError("Ingresa tu correo electrónico"); return; }
    setError("");
    setLoading(true);
    try {
      const { error: idErr } = await signIn.create({ identifier: email });
      if (idErr) {
        setError(idErr.message || "Correo no encontrado en nuestro sistema");
        return;
      }
      const { error: sendErr } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendErr) {
        setError(sendErr.message || "No se pudo enviar el código");
        return;
      }
      setStep("code");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || code.length < 6) { setError("Ingresa el código de 6 dígitos"); return; }
    setError("");
    setLoading(true);
    try {
      const { error: codeErr } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (codeErr) {
        setError(codeErr.message || "Código inválido o expirado");
        return;
      }
      setStep("password");
    } catch {
      setError("Error al verificar el código.");
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    setError("");
    setLoading(true);
    try {
      const { error: pwErr } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      });
      if (pwErr) {
        setError(pwErr.message || "Error al cambiar la contraseña");
        return;
      }
      const { error: finalErr } = await signIn.finalize();
      if (finalErr) {
        setError(finalErr.message || "Error al iniciar sesión");
        return;
      }
      setStep("done");
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full"
    >
      <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.6),0_0_36px_-12px_rgba(184,235,35,0.08),0_0_0_1px_rgba(255,255,255,0.03)_inset]">
        <div
          aria-hidden
          className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />

        {/* Step indicator */}
        {step !== "done" && (
          <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-6">
            {STEPS.map((s, i) => (
              <StepDot key={s} active={i === stepIndex} done={i < stepIndex} />
            ))}
            <span className="text-[11px] text-white/30 ml-2 font-medium">Paso {stepIndex + 1} de 3</span>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <motion.div key="email" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
              <div className="mb-6 text-center lg:text-left">
                <div className="w-11 h-11 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] flex items-center justify-center mb-4 mx-auto lg:mx-0">
                  <KeyRound className="w-5 h-5 text-white/65" />
                </div>
                <h1 className="text-[22px] font-bold text-white tracking-tight">Recuperar contraseña</h1>
                <p className="text-[13px] text-white/45 mt-1.5 leading-relaxed">
                  Ingresa tu correo y te enviaremos un código de verificación
                </p>
              </div>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-red-400/[0.08] border border-red-400/20 text-red-300 text-sm mb-5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}
              <form onSubmit={handleEmail} className="space-y-4">
                <Field
                  label="Correo electrónico"
                  icon={<Mail className="w-3 h-3" />}
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
                <button type="submit" disabled={!signIn || loading}
                  className="w-full h-11 rounded-xl bg-[#B8EB23] hover:bg-[#C5F034] active:bg-[#A5D820] text-black font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_0_28px_-4px_rgba(184,235,35,0.45)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.3)_inset,0_0_36px_-2px_rgba(184,235,35,0.6)]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enviar código
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Step 2: Code ── */}
          {step === "code" && (
            <motion.div key="code" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
              <div className="mb-6 text-center lg:text-left">
                <h1 className="text-[22px] font-bold text-white tracking-tight">Código de verificación</h1>
                <p className="text-[13px] text-white/45 mt-1.5">
                  Revisa <span className="text-white/75 font-medium">{email}</span> e ingresa el código
                </p>
              </div>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-red-400/[0.08] border border-red-400/20 text-red-300 text-sm mb-5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}
              <form onSubmit={handleCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-white/55 tracking-wide">Código de 6 dígitos</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                    className="w-full h-14 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-2xl text-white placeholder-white/20 focus:outline-none focus:border-[#B8EB23]/45 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(184,235,35,0.12)] transition-all text-center tracking-[0.4em] font-mono"
                  />
                </div>
                <button type="submit" disabled={!signIn || loading || code.length < 6}
                  className="w-full h-11 rounded-xl bg-[#B8EB23] hover:bg-[#C5F034] active:bg-[#A5D820] text-black font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_0_28px_-4px_rgba(184,235,35,0.45)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.3)_inset,0_0_36px_-2px_rgba(184,235,35,0.6)]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verificar código
                </button>
              </form>
              <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }}
                className="w-full mt-4 text-[11px] text-white/35 hover:text-white transition-colors flex items-center justify-center gap-1.5 font-medium"
              >
                <ArrowLeft className="w-3 h-3" />
                Cambiar correo electrónico
              </button>
            </motion.div>
          )}

          {/* ── Step 3: New Password ── */}
          {step === "password" && (
            <motion.div key="password" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
              <div className="mb-6 text-center lg:text-left">
                <h1 className="text-[22px] font-bold text-white tracking-tight">Nueva contraseña</h1>
                <p className="text-[13px] text-white/45 mt-1.5">Elige una contraseña segura para tu cuenta</p>
              </div>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-red-400/[0.08] border border-red-400/20 text-red-300 text-sm mb-5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}
              <form onSubmit={handlePassword} className="space-y-4">
                <Field
                  label="Nueva contraseña"
                  icon={<KeyRound className="w-3 h-3" />}
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  right={
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="text-white/30 hover:text-white/65 transition-colors p-0.5" tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <Field
                  label="Confirmar contraseña"
                  icon={<KeyRound className="w-3 h-3" />}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repite tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={confirmPassword && password !== confirmPassword ? "Las contraseñas no coinciden" : undefined}
                  right={
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="text-white/30 hover:text-white/65 transition-colors p-0.5" tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <button type="submit" disabled={!signIn || loading || password !== confirmPassword || password.length < 8}
                  className="w-full h-11 rounded-xl bg-[#B8EB23] hover:bg-[#C5F034] active:bg-[#A5D820] text-black font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_0_28px_-4px_rgba(184,235,35,0.45)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.3)_inset,0_0_36px_-2px_rgba(184,235,35,0.6)]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Cambiar contraseña
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Done ── */}
          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center py-4">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-14 h-14 rounded-2xl bg-[#B8EB23]/10 ring-1 ring-[#B8EB23]/25 flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle2 className="w-7 h-7 text-[#B8EB23]" />
              </motion.div>
              <h1 className="text-[22px] font-bold text-white tracking-tight">¡Contraseña actualizada!</h1>
              <p className="text-[13px] text-white/45 mt-2">Iniciando sesión automáticamente…</p>
              <div className="mt-5 flex justify-center">
                <Loader2 className="w-5 h-5 text-[#B8EB23]/60 animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step !== "done" && (
          <p className="text-center text-[12px] text-white/35 mt-6">
            <Link href="/sign-in" className="text-white/55 hover:text-[#B8EB23] transition-colors flex items-center justify-center gap-1.5 font-medium">
              <ArrowLeft className="w-3 h-3" />
              Volver al inicio de sesión
            </Link>
          </p>
        )}
      </div>
      <p className="text-center text-[11px] text-white/25 mt-5 font-medium">
        Plataforma DOOH para equipos de alto rendimiento
      </p>
    </motion.div>
  );
}
