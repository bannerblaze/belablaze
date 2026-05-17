"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
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
        <p className="text-[11px] text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export function SignInForm() {
  const { signIn } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;

    setError("");
    setFieldErrors({});

    const errs: typeof fieldErrors = {};
    if (!email) errs.email = "Ingresa tu correo electrónico";
    if (!password) errs.password = "Ingresa tu contraseña";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      const { error: idErr } = await signIn.create({ identifier: email });
      if (idErr) {
        const msg = idErr.message || "Correo no encontrado";
        if (msg.toLowerCase().includes("identifier") || msg.toLowerCase().includes("found")) {
          setFieldErrors({ email: "No existe una cuenta con este correo" });
        } else {
          setError(msg);
        }
        return;
      }

      const { error: pwErr } = await signIn.password({ password });
      if (pwErr) {
        const msg = pwErr.message || "Contraseña incorrecta";
        if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("incorrect")) {
          setFieldErrors({ password: "Contraseña incorrecta" });
        } else {
          setError(msg);
        }
        return;
      }

      const { error: finalErr } = await signIn.finalize();
      if (finalErr) {
        setError(finalErr.message || "Error al iniciar sesión");
        return;
      }

      router.replace("/onboarding");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!signIn) return;
    setGoogleLoading(true);
    try {
      const { error: ssoErr } = await signIn.sso({
        strategy: "oauth_google",
        redirectUrl: "/onboarding",
        redirectCallbackUrl: "/sign-in/sso-callback",
      });
      if (ssoErr) {
        setError(ssoErr.message || "No se pudo conectar con Google");
        setGoogleLoading(false);
      }
    } catch {
      setError("Error al conectar con Google. Intenta de nuevo.");
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full"
    >
      {/* Glass card — premium dark with backdrop blur */}
      <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.6),0_0_36px_-12px_rgba(184,235,35,0.08),0_0_0_1px_rgba(255,255,255,0.03)_inset]">
        {/* Top edge highlight */}
        <div
          aria-hidden
          className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />

        {/* Heading — centered on mobile to match hero alignment */}
        <div className="mb-6 text-center lg:text-left">
          <h1 className="text-[22px] font-bold text-white tracking-tight">Inicia sesión en tu cuenta</h1>
          <p className="text-[13px] text-white/45 mt-1.5">Accede a tu plataforma para continuar</p>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={!signIn || googleLoading}
          className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium text-white hover:bg-white/[0.07] hover:border-white/[0.14] active:bg-white/[0.05] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-5"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white/60" />
          ) : (
            <GoogleIcon />
          )}
          Continuar con Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.12em]">o continúa con email</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Global error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-red-400/[0.08] border border-red-400/20 text-red-300 text-sm mb-5"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Correo electrónico"
            icon={<Mail className="w-3 h-3" />}
            type="email"
            placeholder="tu@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
            autoFocus
          />
          <Field
            label="Contraseña"
            icon={<Lock className="w-3 h-3" />}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            autoComplete="current-password"
            right={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-white/30 hover:text-white/65 transition-colors p-0.5"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <div className="flex justify-end -mt-1">
            <Link
              href="/sign-in/forgot-password"
              className="text-[11px] text-white/40 hover:text-[#B8EB23] transition-colors font-medium"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div id="clerk-captcha" />
          <button
            type="submit"
            disabled={!signIn || loading}
            className="w-full h-11 rounded-xl bg-[#B8EB23] hover:bg-[#C5F034] active:bg-[#A5D820] text-black font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_0_28px_-4px_rgba(184,235,35,0.45)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.3)_inset,0_0_36px_-2px_rgba(184,235,35,0.6)] mt-1"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Iniciar sesión
          </button>
        </form>

        <p className="text-center text-[12px] text-white/35 mt-6">
          ¿No tienes cuenta?{" "}
          <Link href="/sign-up" className="text-[#B8EB23] hover:text-[#C5F034] transition-colors font-semibold">
            Regístrate
          </Link>
        </p>
      </div>

      <p className="text-center text-[11px] text-white/25 mt-5 font-medium">
        Plataforma DOOH para equipos de alto rendimiento
      </p>
    </motion.div>
  );
}
