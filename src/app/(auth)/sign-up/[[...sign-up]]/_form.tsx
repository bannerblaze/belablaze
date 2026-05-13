"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignUp } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, Zap, Loader2, AlertCircle, User, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
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
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-white/50 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          className={cn(
            "w-full h-11 px-3 rounded-xl bg-white/[0.04] border text-sm text-white placeholder-white/20 focus:outline-none transition-all",
            right ? "pr-10" : "",
            error
              ? "border-red-400/40 focus:border-red-400/60"
              : "border-white/[0.08] focus:border-[#B8EB23]/50 focus:bg-white/[0.06]"
          )}
        />
        {right && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

type Step = "register" | "verify";

export function SignUpForm() {
  const { signUp } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<Step>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;

    setError("");
    setFieldErrors({});
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Ingresa tu nombre";
    if (!email) errs.email = "Ingresa tu correo";
    if (password.length < 8) errs.password = "Mínimo 8 caracteres";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      const nameParts = name.trim().split(" ");
      const { error: createErr } = await signUp.create({
        emailAddress: email,
        password,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" ") || undefined,
      });
      if (createErr) {
        setError(createErr.message || "Error al crear la cuenta");
        return;
      }

      const { error: sendErr } = await signUp.verifications.sendEmailCode();
      if (sendErr) {
        setError(sendErr.message || "Error al enviar el código");
        return;
      }

      setStep("verify");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;

    setError("");
    if (!code.trim()) { setError("Ingresa el código de verificación"); return; }

    setLoading(true);
    try {
      const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyErr) {
        setError(verifyErr.message || "Código inválido. Intenta de nuevo.");
        return;
      }

      const { error: finalErr } = await signUp.finalize();
      if (finalErr) {
        setError(finalErr.message || "Error al finalizar el registro");
        return;
      }

      // First-time signups land on /onboarding to pick an account type.
      router.replace("/onboarding");
    } catch {
      setError("Error al verificar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!signUp) return;
    setGoogleLoading(true);
    try {
      const { error: ssoErr } = await signUp.sso({
        strategy: "oauth_google",
        redirectUrl: "/onboarding",
        redirectCallbackUrl: "/sign-up/sso-callback",
      });
      if (ssoErr) {
        setError(ssoErr.message || "No se pudo conectar con Google");
        setGoogleLoading(false);
      }
    } catch {
      setError("Error al conectar con Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="mx-auto w-full max-w-[420px]"
    >
      <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-8 shadow-2xl shadow-black/60">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#B8EB23] shadow-[0_0_20px_rgba(184,235,35,0.35)]">
            <Zap className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-white">
              Bela<span className="text-[#B8EB23]">Blaze</span>
            </span>
            <span className="text-[9px] text-white/35 tracking-widest uppercase font-medium mt-0.5">
              by BannerBlaze
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {step === "register" ? (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Crea tu cuenta</h1>
                <p className="text-sm text-white/40 mt-1">Únete a la plataforma BelaBlaze</p>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={!signUp || googleLoading}
                className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium text-white hover:bg-white/[0.07] hover:border-white/[0.13] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-5"
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin text-white/60" /> : <GoogleIcon />}
                Continuar con Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-white/25 font-medium">o regístrate con email</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-red-400/[0.08] border border-red-400/20 text-red-400 text-sm mb-5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <Field
                  label="Nombre completo"
                  icon={<User className="w-3.5 h-3.5" />}
                  type="text"
                  placeholder="Ana Ramírez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={fieldErrors.name}
                  autoComplete="name"
                  autoFocus
                />
                <Field
                  label="Correo electrónico"
                  icon={<Mail className="w-3.5 h-3.5" />}
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                  autoComplete="email"
                />
                <Field
                  label="Contraseña"
                  icon={<Lock className="w-3.5 h-3.5" />}
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fieldErrors.password}
                  autoComplete="new-password"
                  right={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-white/30 hover:text-white/60 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <div id="clerk-captcha" />
                <button
                  type="submit"
                  disabled={!signUp || loading}
                  className="w-full h-11 rounded-xl bg-[#B8EB23] hover:bg-[#caf23a] text-black font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(184,235,35,0.2)] hover:shadow-[0_0_32px_rgba(184,235,35,0.35)]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Crear cuenta
                </button>
              </form>

              <p className="text-center text-xs text-white/30 mt-6">
                ¿Ya tienes cuenta?{" "}
                <Link href="/sign-in" className="text-white/60 hover:text-[#B8EB23] transition-colors font-medium">
                  Inicia sesión
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <div className="w-11 h-11 rounded-2xl bg-[#B8EB23]/10 border border-[#B8EB23]/20 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5 text-[#B8EB23]" />
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">Verifica tu correo</h1>
                <p className="text-sm text-white/40 mt-1">
                  Enviamos un código a{" "}
                  <span className="text-white/70 font-medium">{email}</span>
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-red-400/[0.08] border border-red-400/20 text-red-400 text-sm mb-5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Código de verificación</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                    className="w-full h-14 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-2xl text-white placeholder-white/20 focus:outline-none focus:border-[#B8EB23]/50 transition-all text-center tracking-[0.4em] font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!signUp || loading || code.length < 6}
                  className="w-full h-11 rounded-xl bg-[#B8EB23] hover:bg-[#caf23a] text-black font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(184,235,35,0.2)]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verificar cuenta
                </button>
              </form>

              <p className="text-center text-xs text-white/30 mt-6">
                <button
                  type="button"
                  onClick={() => { setStep("register"); setCode(""); setError(""); }}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  ← Volver y cambiar correo
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-[11px] text-white/20 mt-5">
        Plataforma DOOH para equipos de alto rendimiento
      </p>
    </motion.div>
  );
}
