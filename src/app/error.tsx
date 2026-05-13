"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for telemetry; replace with proper logger if added later.
     
    console.error("[BelaBlaze] route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md text-center"
      >
        {/* Glow icon */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 rounded-2xl bg-red-500/20 blur-2xl" />
          <div className="relative w-16 h-16 rounded-2xl bg-[#141414] border border-red-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-400" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-xl font-bold text-white mb-2 tracking-tight">
          Algo salió mal
        </h1>
        <p className="text-sm text-white/40 leading-relaxed max-w-sm mx-auto mb-6">
          Encontramos un error inesperado al cargar esta página. Puedes reintentar o volver al inicio.
        </p>

        {error.digest && (
          <div className="inline-block mb-6 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
            <code className="text-[10px] font-mono text-white/30">ref: {error.digest}</code>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8EB23] text-black text-sm font-semibold hover:bg-[#D4F564] transition-all shadow-[0_0_20px_rgba(184,235,35,0.2)]"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.06] hover:text-white transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            Volver al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
