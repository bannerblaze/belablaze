import { Zap } from "lucide-react";

/**
 * Global route-level loading state. Shows briefly during initial navigation
 * before the route segment's own Suspense kicks in.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0A]/80 backdrop-blur-sm pointer-events-none">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-[#B8EB23]/30 blur-2xl animate-pulse" />
          <div className="relative w-12 h-12 rounded-2xl bg-[#B8EB23] flex items-center justify-center">
            <Zap className="w-6 h-6 text-black animate-pulse" strokeWidth={2.5} />
          </div>
        </div>
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/30 font-medium">
          Cargando
        </div>
      </div>
    </div>
  );
}
