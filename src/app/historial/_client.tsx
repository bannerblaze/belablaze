"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  History, Megaphone, MonitorPlay, Building2, Image as ImageIcon,
  Shield, Settings, Key, FileText,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

type Item = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  user: { name: string; email: string } | null;
};

interface Props {
  items: Item[];
  total: number;
}

const FILTERS = [
  { value: "",           label: "Todo" },
  { value: "Campaign",   label: "Campañas" },
  { value: "Ad",         label: "Anuncios" },
  { value: "Screen",     label: "Pantallas" },
  { value: "Client",     label: "Clientes" },
  { value: "MediaAsset", label: "Media" },
];

function iconFor(entityType: string) {
  switch (entityType) {
    case "Organization": return Building2;
    case "Campaign":
    case "Ad":           return Megaphone;
    case "Screen":       return MonitorPlay;
    case "Client":       return Building2;
    case "MediaAsset":   return ImageIcon;
    case "ApiKey":
    case "Webhook":      return Key;
    case "Settings":     return Settings;
    case "User":         return Shield;
    default:             return FileText;
  }
}

/* Action verb in Spanish — keeps the timeline readable. */
function describe(action: string): string {
  const map: Record<string, string> = {
    "campaign.create":   "creó una campaña",
    "campaign.update":   "actualizó una campaña",
    "campaign.delete":   "eliminó una campaña",
    "campaign.pause":    "pausó una campaña",
    "campaign.approve":  "aprobó una campaña",
    "ad.create":         "creó un anuncio",
    "ad.update":         "actualizó un anuncio",
    "ad.delete":         "eliminó un anuncio",
    "ad.approve":        "aprobó un anuncio",
    "ad.reject":         "rechazó un anuncio",
    "ad.publish":        "publicó un anuncio",
    "screen.create":     "registró una pantalla",
    "screen.update":     "actualizó una pantalla",
    "screen.delete":     "eliminó una pantalla",
    "client.create":     "agregó un cliente",
    "client.update":     "actualizó un cliente",
    "client.delete":     "eliminó un cliente",
    "media.upload":      "subió un archivo",
    "media.delete":      "eliminó un archivo",
    "org.create":        "creó la organización",
    "org.update":        "actualizó la organización",
    "user.login":        "inició sesión",
    "user.logout":       "cerró sesión",
    "settings.update":   "actualizó la configuración",
  };
  return map[action] ?? action;
}

function actionAccent(action: string): string {
  if (action.endsWith(".create") || action.endsWith(".upload")) return "text-[#B8EB23] ring-[#B8EB23]/20 bg-[#B8EB23]/[0.08]";
  if (action.endsWith(".approve") || action.endsWith(".publish")) return "text-green-400 ring-green-400/20 bg-green-400/[0.08]";
  if (action.endsWith(".reject") || action.endsWith(".delete")) return "text-red-400 ring-red-400/20 bg-red-400/[0.08]";
  if (action.endsWith(".pause") || action.endsWith(".logout")) return "text-orange-400 ring-orange-400/20 bg-orange-400/[0.08]";
  return "text-white/55 ring-white/10 bg-white/[0.04]";
}

export function HistorialClient({ items, total }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get("entityType") ?? "";

  const setFilter = (entityType: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (entityType) sp.set("entityType", entityType);
    else sp.delete("entityType");
    router.push(`/historial${sp.toString() ? `?${sp}` : ""}`);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-7 max-w-[1000px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#B8EB23]/10 ring-1 ring-[#B8EB23]/20 flex items-center justify-center text-[#B8EB23]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl lg:text-[22px] font-bold text-white tracking-tight leading-none">
              Historial
            </h1>
            <p className="text-[12px] text-white/40 mt-1.5">
              {total.toLocaleString()} eventos registrados en esta cuenta
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ring-1",
              activeFilter === f.value
                ? "bg-[#B8EB23]/[0.08] text-[#B8EB23] ring-[#B8EB23]/20"
                : "bg-transparent text-white/45 ring-white/[0.06] hover:text-white hover:ring-white/[0.12]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {items.length === 0 ? (
        <div className="rounded-2xl bg-[#0E0E10] border border-white/[0.06] py-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.04] text-white/20 mb-3">
            <History className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-white">Sin actividad todavía</p>
          <p className="text-xs text-white/35 mt-1.5 max-w-xs mx-auto">
            Cada acción que realices en tu cuenta aparecerá aquí en orden cronológico.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/[0.06]" />

          <ul className="space-y-3">
            {items.map((item, idx) => {
              const Icon = iconFor(item.entityType);
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(idx * 0.025, 0.4), ease: [0.4, 0, 0.2, 1] }}
                  className="relative flex items-start gap-4"
                >
                  {/* Timeline dot / icon */}
                  <div className={cn(
                    "relative z-10 w-10 h-10 rounded-xl ring-1 flex items-center justify-center flex-shrink-0 shadow-[0_0_0_4px_#070708]",
                    actionAccent(item.action),
                  )}>
                    <Icon className="w-[15px] h-[15px]" strokeWidth={1.8} />
                  </div>

                  {/* Content card */}
                  <div className="flex-1 min-w-0 rounded-xl bg-[#0E0E10] border border-white/[0.06] px-4 py-3 hover:border-white/[0.1] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] text-white leading-snug">
                          <span className="font-semibold">{item.user?.name ?? "Sistema"}</span>
                          <span className="text-white/55"> {describe(item.action)}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-white/35">
                          <code className="font-mono uppercase tracking-wide">{item.action}</code>
                          {item.entityId && (
                            <>
                              <span className="text-white/15">·</span>
                              <code className="font-mono">{item.entityId.slice(0, 10)}…</code>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-[11px] text-white/35 whitespace-nowrap font-medium">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
