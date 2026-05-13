import Link from "next/link";
import { Compass, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-6 dot-grid">
      <div className="w-full max-w-md text-center">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 rounded-2xl bg-[#B8EB23]/12 blur-3xl" />
          <div className="relative w-16 h-16 rounded-2xl bg-[#141414] border border-white/[0.1] flex items-center justify-center mx-auto">
            <Compass className="w-7 h-7 text-[#B8EB23]" strokeWidth={1.5} />
          </div>
        </div>

        <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 font-semibold mb-3">
          404 · Not found
        </p>
        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
          Esta página no existe
        </h1>
        <p className="text-sm text-white/40 leading-relaxed max-w-sm mx-auto mb-7">
          La dirección que buscas se movió o nunca existió. Volvamos a un lugar conocido.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8EB23] text-black text-sm font-semibold hover:bg-[#D4F564] transition-all shadow-[0_0_20px_rgba(184,235,35,0.2)]"
          >
            <Home className="w-3.5 h-3.5" />
            Ir al dashboard
          </Link>
          <Link
            href="/campaigns"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.06] hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ver campañas
          </Link>
        </div>
      </div>
    </div>
  );
}
