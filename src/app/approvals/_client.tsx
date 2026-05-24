"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, ShieldCheck, Clock, CheckCircle2, XCircle,
  Rocket, ChevronDown, ChevronUp, MessageSquare, Building2,
  Mail, Image as ImageIcon, Video, Code, Zap, ArrowRight,
  Calendar, Timer, Globe, QrCode, X,
} from "lucide-react";
import { toast } from "sonner";
import { approveAd, rejectAd, publishAd } from "@/actions/approvals";
import { cn, formatRelativeTime, formatDate, truncate } from "@/lib/utils";
import { staggerChild } from "@/lib/motion";
import type { ModerationAd, ModerationOverview } from "@/services/admin/approvals.service";

/* ──────────────────────────────────────────────────────────────────────
 * /approvals — BannerBlaze internal moderation panel.
 *
 * Tabs: Pendientes | Aprobados | Publicados | Rechazados
 * Each row expands to show ad details + action buttons.
 * Reject requires a mandatory written reason saved to DB.
 * ────────────────────────────────────────────────────────────────────── */

type Tab = "PENDING_REVIEW" | "APPROVED" | "PUBLISHED" | "REJECTED";

interface Props {
  overview: ModerationOverview | null;
  initialPending: ModerationAd[];
  initialApproved: ModerationAd[];
  initialRejected: ModerationAd[];
  initialPublished: ModerationAd[];
}

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  IMAGE:       <ImageIcon className="w-3.5 h-3.5" />,
  VIDEO:       <Video className="w-3.5 h-3.5" />,
  HTML5:       <Code className="w-3.5 h-3.5" />,
  INTERACTIVE: <Zap className="w-3.5 h-3.5" />,
};

const FORMAT_LABELS: Record<string, string> = {
  IMAGE: "Imagen", VIDEO: "Video", HTML5: "HTML5", INTERACTIVE: "Interactivo",
};

/* ────────── Overview strip ────────── */
function OverviewStrip({ overview }: { overview: ModerationOverview | null }) {
  if (!overview) return null;

  const tiles = [
    {
      label: "Pendientes",
      value: overview.totalPending,
      accent: "text-yellow-400",
      bg: "bg-yellow-400/10",
      bar: "bg-yellow-400",
    },
    {
      label: "Aprobados hoy",
      value: overview.approvedToday,
      accent: "text-green-400",
      bg: "bg-green-400/10",
      bar: "bg-green-400",
    },
    {
      label: "Publicados hoy",
      value: overview.publishedToday,
      accent: "text-[#B8EB23]",
      bg: "bg-[#B8EB23]/10",
      bar: "bg-[#B8EB23]",
    },
    {
      label: "Rechazados hoy",
      value: overview.rejectedToday,
      accent: "text-red-400",
      bg: "bg-red-400/10",
      bar: "bg-red-400",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="relative rounded-2xl bg-[#0E0E10] border border-white/[0.06] px-5 py-5 min-h-[112px] flex flex-col justify-between overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
        >
          <div className={cn("absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full", t.bar)} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">
            {t.label}
          </p>
          <p className={cn("text-[28px] font-bold tabular-nums leading-none mt-2", t.accent)}>
            {t.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ────────── Ad row (expandable) ────────── */
function AdRow({
  ad,
  tab,
  onApprove,
  onReject,
  onPublish,
}: {
  ad: ModerationAd;
  tab: Tab;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
  onPublish: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  const handleReject = () => {
    if (!note.trim()) {
      toast.error("Escribe el motivo de rechazo antes de confirmar.");
      return;
    }
    onReject(ad.id, note);
    setRejecting(false);
    setNote("");
  };

  const isPending = tab === "PENDING_REVIEW";
  const isApproved = tab === "APPROVED";

  const borderColor =
    isPending ? "border-yellow-400/15" :
    isApproved ? "border-green-400/15" :
    tab === "PUBLISHED" ? "border-[#B8EB23]/15" :
    "border-red-400/10";

  const iconBg =
    isPending ? "bg-yellow-400/10 text-yellow-400" :
    isApproved ? "bg-green-400/10 text-green-400" :
    tab === "PUBLISHED" ? "bg-[#B8EB23]/10 text-[#B8EB23]" :
    "bg-red-400/10 text-red-400";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className={cn("rounded-2xl border bg-[#0E0E10] overflow-hidden", borderColor)}
    >
      {/* Collapsed header */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-white/[0.04]", iconBg)}>
          {FORMAT_ICONS[ad.format] ?? <ImageIcon className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-[14px] font-semibold text-white truncate leading-tight">{ad.title}</p>
              <div className="flex items-center gap-2 text-[11px] text-white/45">
                <span className="truncate">{ad.campaign?.name}</span>
                {ad.org && (
                  <>
                    <span className="text-white/20">·</span>
                    <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{ad.org.name}</span>
                  </>
                )}
                {ad.ownerEmail && (
                  <>
                    <span className="text-white/20 hidden sm:inline">·</span>
                    <Mail className="w-2.5 h-2.5 flex-shrink-0 hidden sm:inline" />
                    <span className="truncate hidden sm:inline">{ad.ownerEmail}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="text-[11px] text-white/30 hidden md:block">
                {ad.submittedAt
                  ? <>Enviado {formatRelativeTime(ad.submittedAt)}</>
                  : formatRelativeTime(ad.createdAt)}
              </span>
              <span className="text-[10px] font-semibold text-white/50 bg-white/[0.04] ring-1 ring-white/[0.04] px-2 py-1 rounded-md leading-none">
                {FORMAT_LABELS[ad.format] ?? ad.format}
              </span>
              {expanded
                ? <ChevronUp className="w-4 h-4 text-white/35" />
                : <ChevronDown className="w-4 h-4 text-white/35" />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-white/[0.05] p-4 space-y-4">
              {/* Media preview */}
              <div className="rounded-xl bg-[#080808] border border-white/[0.06] overflow-hidden relative" style={{ minHeight: "7rem" }}>
                {ad.thumbnailUrl ? (
                  ad.format === "VIDEO" ? (
                    <video
                      src={ad.thumbnailUrl}
                      className="w-full max-h-64 object-contain bg-black"
                      controls
                      preload="metadata"
                      playsInline
                      muted
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ad.thumbnailUrl}
                      alt={ad.title}
                      className="w-full max-h-64 object-contain bg-black"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "flex");
                      }}
                    />
                  )
                ) : null}
                {/* Fallback — shown when no URL or image load fails */}
                <div
                  className="flex flex-col items-center justify-center h-28 text-center"
                  style={{ display: ad.thumbnailUrl ? "none" : "flex" }}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-1.5", iconBg)}>
                    {FORMAT_ICONS[ad.format]}
                  </div>
                  <p className="text-[11px] text-white/30">Preview no disponible</p>
                </div>
                <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                  <span className="text-[10px] font-mono bg-black/70 text-white/50 px-1.5 py-0.5 rounded-md">
                    {ad.duration}s
                  </span>
                </div>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {[
                  { icon: <Timer className="w-3 h-3" />, label: "Duración", value: `${ad.duration}s` },
                  { icon: <Calendar className="w-3 h-3" />, label: "Inicio", value: ad.startDate ? formatDate(ad.startDate) : "—" },
                  { icon: <Calendar className="w-3 h-3" />, label: "Fin", value: ad.endDate ? formatDate(ad.endDate) : "—" },
                  { icon: <Globe className="w-3 h-3" />, label: "CTA", value: ad.ctaText ?? "—" },
                  { icon: <Mail className="w-3 h-3" />, label: "Contacto", value: ad.ownerName ?? "—" },
                  { icon: <QrCode className="w-3 h-3" />, label: "QR", value: ad.qrEnabled ? "Habilitado" : "Deshabilitado" },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="space-y-0.5">
                    <div className="flex items-center gap-1 text-white/30">
                      {icon}
                      <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
                    </div>
                    <p className="text-white/70 font-medium truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              {ad.description && (
                <div>
                  <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-1">Descripción</p>
                  <p className="text-xs text-white/55 leading-relaxed">{ad.description}</p>
                </div>
              )}

              {/* Rejection note (if rejected) */}
              {ad.rejectionNote && tab !== "PENDING_REVIEW" && (
                <div className="p-3 rounded-lg bg-red-400/[0.06] border border-red-400/15">
                  <p className="text-[10px] uppercase tracking-wider text-red-400/60 font-semibold mb-1">Motivo de rechazo</p>
                  <p className="text-xs text-red-300/80">&ldquo;{ad.rejectionNote}&rdquo;</p>
                </div>
              )}

              {/* Review timestamps */}
              {(ad.reviewedAt || ad.publishedAt) && (
                <div className="flex items-center gap-4 text-[11px] text-white/30">
                  {ad.reviewedAt && (
                    <span>Revisado {formatRelativeTime(ad.reviewedAt)}</span>
                  )}
                  {ad.publishedAt && (
                    <span className="text-[#B8EB23]/50">Publicado {formatRelativeTime(ad.publishedAt)}</span>
                  )}
                </div>
              )}

              {/* Reject form */}
              <AnimatePresence>
                {rejecting && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-white/50 font-medium flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Motivo del rechazo <span className="text-red-400">*</span>
                        <span className="text-white/30 font-normal">(visible para el cliente)</span>
                      </label>
                      <button
                        onClick={() => { setRejecting(false); setNote(""); }}
                        className="text-white/30 hover:text-white p-1 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ej: El material no cumple con la resolución mínima requerida (mín. 1920×1080). Por favor re-envía con el archivo corregido."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-red-400/30 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-400/50 resize-none transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              {isPending && (
                <div className="flex items-center gap-2 pt-1">
                  {!rejecting ? (
                    <>
                      <button
                        onClick={() => onApprove(ad.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-400/15 text-green-400 text-sm font-semibold hover:bg-green-400/25 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => setRejecting(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-400/10 text-red-400 text-sm font-semibold hover:bg-red-400/20 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleReject}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-400/15 text-red-400 text-sm font-semibold hover:bg-red-400/25 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Confirmar rechazo
                      </button>
                      <button
                        onClick={() => { setRejecting(false); setNote(""); }}
                        className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              )}

              {isApproved && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onPublish(ad.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#B8EB23]/15 text-[#B8EB23] text-sm font-semibold hover:bg-[#B8EB23]/25 transition-colors"
                  >
                    <Rocket className="w-4 h-4" />
                    Publicar anuncio
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ────────── Main client ────────── */

export function ApprovalsClient({
  overview,
  initialPending,
  initialApproved,
  initialRejected,
  initialPublished,
}: Props) {
  const [tab, setTab] = useState<Tab>("PENDING_REVIEW");
  const [pending, setPending] = useState<ModerationAd[]>(initialPending);
  const [approved, setApproved] = useState<ModerationAd[]>(initialApproved);
  const [rejected, setRejected] = useState<ModerationAd[]>(initialRejected);
  const [published, setPublished] = useState<ModerationAd[]>(initialPublished);
  const [, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      try {
        const ad = pending.find((a) => a.id === id);
        if (!ad) return;
        const result = await approveAd(id);
        if (result?.success) {
          setPending((p) => p.filter((a) => a.id !== id));
          setApproved((a) => [{ ...ad, status: "APPROVED", reviewedAt: new Date().toISOString() }, ...a]);
          toast.success("Anuncio aprobado. Listo para publicar.");
        } else {
          toast.error("Error al aprobar el anuncio.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al aprobar el anuncio.");
      }
    });
  };

  const handleReject = (id: string, note: string) => {
    startTransition(async () => {
      try {
        const ad = pending.find((a) => a.id === id);
        if (!ad) return;
        const result = await rejectAd(id, note);
        if (result?.success) {
          setPending((p) => p.filter((a) => a.id !== id));
          setRejected((r) => [{
            ...ad, status: "REJECTED", rejectionNote: note, reviewedAt: new Date().toISOString(),
          }, ...r]);
          toast.error("Anuncio rechazado. El motivo será visible para el cliente.");
        } else {
          toast.error("Error al rechazar el anuncio.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al rechazar el anuncio.");
      }
    });
  };

  const handlePublish = (id: string) => {
    startTransition(async () => {
      try {
        const ad = approved.find((a) => a.id === id);
        if (!ad) return;
        const result = await publishAd(id);
        if (result?.success) {
          setApproved((a) => a.filter((x) => x.id !== id));
          setPublished((p) => [{ ...ad, status: "PUBLISHED", publishedAt: new Date().toISOString() }, ...p]);
          toast.success("Anuncio publicado exitosamente.");
        } else {
          toast.error("Error al publicar el anuncio.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al publicar el anuncio.");
      }
    });
  };

  const TABS = [
    { key: "PENDING_REVIEW" as const, label: "Pendientes", count: pending.length,    dot: "bg-yellow-400" },
    { key: "APPROVED"       as const, label: "Aprobados",  count: approved.length,   dot: "bg-green-400" },
    { key: "PUBLISHED"      as const, label: "Publicados", count: published.length,  dot: "bg-[#B8EB23]" },
    { key: "REJECTED"       as const, label: "Rechazados", count: rejected.length,   dot: "bg-red-400" },
  ];

  const currentList =
    tab === "PENDING_REVIEW" ? pending :
    tab === "APPROVED"       ? approved :
    tab === "PUBLISHED"      ? published :
    rejected;

  const emptyMessages: Record<Tab, string> = {
    PENDING_REVIEW: "No hay anuncios pendientes de revisión. ¡Todo al día!",
    APPROVED: "No hay anuncios aprobados esperando publicación.",
    PUBLISHED: "Aún no hay anuncios publicados.",
    REJECTED: "No hay anuncios rechazados.",
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-7 max-w-[1280px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-3"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-[22px] font-bold text-white tracking-tight">
              Moderación de anuncios
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-400/[0.08] border border-yellow-400/20 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              <ShieldCheck className="w-2.5 h-2.5" />
              Interno
            </span>
          </div>
          <p className="text-[13px] text-white/45 max-w-2xl leading-relaxed">
            Revisión y publicación de anuncios DOOH — flujo completo: revisión → aprobación → publicación. Solo visible para personal de BannerBlaze.
          </p>
        </div>
      </motion.div>

      {/* Workflow breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: "Cliente envía anuncio",    icon: <ImageIcon className="w-3 h-3" />,     active: true },
          { label: "En revisión",              icon: <Clock className="w-3 h-3" />,          active: tab === "PENDING_REVIEW" },
          { label: "Aprobado / Rechazado",     icon: <ClipboardCheck className="w-3 h-3" />, active: tab === "APPROVED" || tab === "REJECTED" },
          { label: "Publicado",                icon: <Rocket className="w-3 h-3" />,         active: tab === "PUBLISHED" },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold ring-1",
              step.active
                ? "bg-[#B8EB23]/[0.08] text-[#B8EB23] ring-[#B8EB23]/20"
                : "bg-white/[0.02] text-white/35 ring-white/[0.05]",
            )}>
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < 3 && <ArrowRight className="w-3 h-3 text-white/15 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Overview */}
      <OverviewStrip overview={overview} />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0E0E10] border border-white/[0.06] w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all",
              tab === t.key
                ? "bg-white/[0.07] text-white"
                : "text-white/45 hover:text-white hover:bg-white/[0.03]",
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />
            {t.label}
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-[10px] tabular-nums font-bold leading-none",
              tab === t.key ? "bg-black/30 text-white/75" : "bg-white/[0.05] text-white/45",
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Ad list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {currentList.map((ad, i) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={staggerChild(i)}
            >
              <AdRow
                ad={ad}
                tab={tab}
                onApprove={handleApprove}
                onReject={handleReject}
                onPublish={handlePublish}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {currentList.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center rounded-2xl bg-[#0F0F0F] border border-white/[0.06]"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.04] text-white/20 mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm text-white/30">{emptyMessages[tab]}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
