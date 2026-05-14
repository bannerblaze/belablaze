"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Clock, ChevronDown,
  ChevronUp, MessageSquare, Video, Image, Zap, Code,
  ClipboardCheck, AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime, formatDate, getFormatConfig, truncate, cn } from "@/lib/utils";
import { toast } from "sonner";
import { approveAd, rejectAd } from "@/actions/approvals";

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  IMAGE: <Image className="w-4 h-4" />,
  VIDEO: <Video className="w-4 h-4" />,
  HTML5: <Code className="w-4 h-4" />,
  INTERACTIVE: <Zap className="w-4 h-4" />,
};

type Ad = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  format: string;
  duration: number;
  ctaText?: string | null;
  ctaUrl?: string | null;
  qrEnabled: boolean;
  qrUrl?: string | null;
  rejectionNote?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  impressions: number;
  clicks: number;
  qrScans: number;
  ctr: number;
  createdAt: string;
  updatedAt: string;
  campaign?: { id: string; name: string; client?: { name: string } | null } | null;
};

function ReviewCard({ ad, onApprove, onReject }: {
  ad: Ad;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const formatCfg = getFormatConfig(ad.format);

  const handleReject = () => {
    if (!note.trim()) {
      toast.error("Escribe un motivo de rechazo antes de continuar.");
      return;
    }
    onReject(ad.id, note);
    setRejecting(false);
    setNote("");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-yellow-400/15 bg-[#111111] overflow-hidden"
    >
      <div
        className="flex items-start gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 flex-shrink-0">
          {FORMAT_ICONS[ad.format]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{ad.title}</p>
              <p className="text-xs text-white/40 mt-0.5">{ad.campaign?.name} · {ad.campaign?.client?.name}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={ad.status} size="sm" />
              {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[11px] text-white/40">
              {FORMAT_ICONS[ad.format]}
              <span className="ml-1">{formatCfg.label}</span>
            </span>
            <span className="text-white/20">·</span>
            <span className="text-[11px] text-white/40">{ad.duration}s</span>
            {ad.qrEnabled && (
              <>
                <span className="text-white/20">·</span>
                <Badge variant="info" size="sm">QR habilitado</Badge>
              </>
            )}
            <span className="text-white/20">·</span>
            <span className="text-[11px] text-white/35">Enviado {formatRelativeTime(ad.createdAt)}</span>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-white/[0.06] p-4 space-y-4">
              <div className="rounded-xl bg-[#0A0A0A] border border-white/[0.08] h-32 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent" />
                <div className="relative z-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 mx-auto mb-2">
                    {FORMAT_ICONS[ad.format]}
                  </div>
                  <p className="text-xs text-white/30">Preview no disponible — archivo pendiente</p>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-mono bg-black/60 text-white/50 px-2 py-0.5 rounded-md">
                    {ad.duration}s
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: "CTA", value: ad.ctaText || "—" },
                  { label: "URL destino", value: ad.ctaUrl ? truncate(ad.ctaUrl, 30) : "—" },
                  { label: "Inicio", value: ad.startDate ? formatDate(ad.startDate) : "—" },
                  { label: "Fin", value: ad.endDate ? formatDate(ad.endDate) : "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-white/35 mb-0.5">{label}</p>
                    <p className="text-white/80 font-medium">{value}</p>
                  </div>
                ))}
              </div>

              {ad.description && (
                <div>
                  <p className="text-[11px] text-white/35 mb-1">Descripción</p>
                  <p className="text-xs text-white/60 leading-relaxed">{ad.description}</p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-2">
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Lista de verificación
                </p>
                {[
                  { ok: !!ad.title, label: "Título definido" },
                  { ok: !!ad.format, label: "Formato especificado" },
                  { ok: ad.duration > 0, label: "Duración válida (> 0s)" },
                  { ok: !!ad.startDate && !!ad.endDate, label: "Fechas de publicación" },
                  { ok: !ad.qrEnabled || !!ad.qrUrl, label: "QR configurado correctamente" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    {item.ok
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                    <span className={cn("text-xs", item.ok ? "text-white/60" : "text-yellow-400")}>{item.label}</span>
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {rejecting && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="space-y-2"
                  >
                    <label className="text-xs text-white/50 font-medium flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Motivo del rechazo (visible para el cliente)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ej: El material no cumple con la resolución mínima requerida (mín. 1920×1080)."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-red-400/30 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-400/50 resize-none transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 pt-1">
                {!rejecting ? (
                  <>
                    <Button
                      variant="brand"
                      size="sm"
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={() => onApprove(ad.id)}
                    >
                      Aprobar anuncio
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<XCircle className="w-4 h-4" />}
                      onClick={() => setRejecting(true)}
                    >
                      Rechazar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<XCircle className="w-4 h-4" />}
                      onClick={handleReject}
                    >
                      Confirmar rechazo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setRejecting(false); setNote(""); }}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface ApprovalsClientProps {
  initialPending: Ad[];
  initialApproved: Ad[];
  initialRejected: Ad[];
}

export function ApprovalsClient({ initialPending, initialApproved, initialRejected }: ApprovalsClientProps) {
  const [pending, setPending] = useState<Ad[]>(initialPending);
  const [approved, setApproved] = useState<Ad[]>(initialApproved);
  const [rejected, setRejected] = useState<Ad[]>(initialRejected);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [isPending, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const ad = pending.find((a) => a.id === id);
      if (!ad) return;

      const result = await approveAd(id);
      if (result?.success) {
        setPending((prev) => prev.filter((a) => a.id !== id));
        setApproved((prev) => [{ ...ad, status: "APPROVED", updatedAt: new Date().toISOString() }, ...prev]);
        toast.success("Anuncio aprobado. Pasará a programación.");
      } else {
        toast.error("Error al aprobar el anuncio.");
      }
    });
  };

  const handleReject = (id: string, note: string) => {
    startTransition(async () => {
      const ad = pending.find((a) => a.id === id);
      if (!ad) return;

      const result = await rejectAd(id, note);
      if (result?.success) {
        setPending((prev) => prev.filter((a) => a.id !== id));
        setRejected((prev) => [{ ...ad, status: "REJECTED", rejectionNote: note, updatedAt: new Date().toISOString() }, ...prev]);
        toast.error("Anuncio rechazado. El cliente será notificado.");
      } else {
        toast.error("Error al rechazar el anuncio.");
      }
    });
  };

  const TABS = [
    { key: "pending" as const, label: "Pendientes", count: pending.length, color: "yellow" },
    { key: "approved" as const, label: "Aprobados", count: approved.length, color: "green" },
    { key: "rejected" as const, label: "Rechazados", count: rejected.length, color: "red" },
  ];

  const currentList = tab === "pending" ? pending : tab === "approved" ? approved : rejected;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[900px]">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400">
          <ClipboardCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Sistema de Aprobaciones</h2>
          <p className="text-xs text-white/40 mt-0.5">Revisa y aprueba los anuncios antes de publicarse</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-4 rounded-xl bg-[#111111] border border-white/[0.06]">
        {[
          { label: "Cliente sube anuncio", icon: <Image className="w-3.5 h-3.5" />, active: true },
          { label: "En revisión", icon: <Clock className="w-3.5 h-3.5" />, active: true },
          { label: "Admin aprueba / rechaza", icon: <ClipboardCheck className="w-3.5 h-3.5" />, active: tab === "pending" },
          { label: "Publicación programada", icon: <CheckCircle2 className="w-3.5 h-3.5" />, active: false },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
              step.active ? "bg-[#B8EB23]/10 text-[#B8EB23]" : "bg-white/[0.04] text-white/30"
            )}>
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < 3 && <div className="w-4 h-px bg-white/[0.08] flex-shrink-0" />}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.key ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white"
            )}
          >
            {t.label}
            <span className={cn(
              "flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold",
              t.color === "yellow" ? "bg-yellow-400/20 text-yellow-400" :
              t.color === "green" ? "bg-green-400/20 text-green-400" :
              "bg-red-400/20 text-red-400"
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {currentList.map((ad) => (
            tab === "pending" ? (
              <ReviewCard key={ad.id} ad={ad} onApprove={handleApprove} onReject={handleReject} />
            ) : (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-[#111111]"
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                  ad.status === "REJECTED" ? "bg-red-400/10 text-red-400" : "bg-green-400/10 text-green-400"
                )}>
                  {ad.status === "REJECTED" ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{ad.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{ad.campaign?.name}</p>
                  {ad.rejectionNote && (
                    <p className="text-xs text-red-400/70 mt-1 italic">&ldquo;{truncate(ad.rejectionNote, 80)}&rdquo;</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={ad.status} size="sm" />
                  <span className="text-xs text-white/30">{formatRelativeTime(ad.updatedAt)}</span>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {currentList.length === 0 && (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">
              {tab === "pending" ? "No hay anuncios pendientes. ¡Todo al día!" : `No hay anuncios ${tab === "approved" ? "aprobados" : "rechazados"}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
