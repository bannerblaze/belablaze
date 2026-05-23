"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, CheckCircle2, XCircle, MessageSquare, X,
  Building2, User, Calendar, DollarSign, ChevronDown, ChevronUp,
  Clock,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { approveCampaign, rejectCampaign } from "@/actions/campaigns";
import { cn, formatRelativeTime } from "@/lib/utils";

export interface PendingCampaign {
  id: string;
  name: string;
  description: string | null;
  budget: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  client: { name: string } | null;
  creator: { name: string; email: string } | null;
}

function formatBudget(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  return `${fmt(start)} — ${fmt(end)}`;
}

function CampaignRow({
  campaign,
  onApprove,
  onReject,
}: {
  campaign: PendingCampaign;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const handleReject = () => {
    if (!reason.trim()) {
      toast.error("Escribe el motivo de rechazo antes de confirmar.");
      return;
    }
    onReject(campaign.id, reason);
    setRejecting(false);
    setReason("");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl border border-yellow-400/15 bg-[#0E0E10] overflow-hidden"
    >
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 text-yellow-400 flex items-center justify-center flex-shrink-0 ring-1 ring-white/[0.04]">
          <ClipboardList className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-[14px] font-semibold text-white truncate leading-tight">
                {campaign.name}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-white/45">
                {campaign.client && (
                  <>
                    <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{campaign.client.name}</span>
                  </>
                )}
                {campaign.creator && (
                  <>
                    <span className="text-white/20">·</span>
                    <User className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{campaign.creator.name}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="text-[11px] text-white/30 hidden md:block">
                {formatRelativeTime(campaign.createdAt)}
              </span>
              <span className="text-[10px] font-semibold text-yellow-400/70 bg-yellow-400/[0.07] ring-1 ring-yellow-400/15 px-2 py-1 rounded-md leading-none">
                Pendiente
              </span>
              {expanded
                ? <ChevronUp className="w-4 h-4 text-white/35" />
                : <ChevronDown className="w-4 h-4 text-white/35" />}
            </div>
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
            <div className="border-t border-white/[0.05] p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {[
                  {
                    icon: <DollarSign className="w-3 h-3" />,
                    label: "Presupuesto",
                    value: formatBudget(campaign.budget),
                  },
                  {
                    icon: <Calendar className="w-3 h-3" />,
                    label: "Vigencia",
                    value: formatDateRange(campaign.startDate, campaign.endDate),
                  },
                  {
                    icon: <Clock className="w-3 h-3" />,
                    label: "Enviada",
                    value: formatRelativeTime(campaign.createdAt),
                  },
                  campaign.client && {
                    icon: <Building2 className="w-3 h-3" />,
                    label: "Cliente",
                    value: campaign.client.name,
                  },
                  campaign.creator && {
                    icon: <User className="w-3 h-3" />,
                    label: "Creador",
                    value: campaign.creator.email,
                  },
                ]
                  .filter(Boolean)
                  .map((item) => {
                    const i = item as { icon: React.ReactNode; label: string; value: string };
                    return (
                      <div key={i.label} className="space-y-0.5">
                        <div className="flex items-center gap-1 text-white/30">
                          {i.icon}
                          <span className="text-[10px] uppercase tracking-wider font-semibold">
                            {i.label}
                          </span>
                        </div>
                        <p className="text-white/70 font-medium truncate">{i.value}</p>
                      </div>
                    );
                  })}
              </div>

              {campaign.description && (
                <div>
                  <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-1">
                    Descripción
                  </p>
                  <p className="text-xs text-white/55 leading-relaxed">{campaign.description}</p>
                </div>
              )}

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
                      </label>
                      <button
                        onClick={() => { setRejecting(false); setReason(""); }}
                        className="text-white/30 hover:text-white p-1 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ej: Presupuesto insuficiente para las pantallas solicitadas."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-red-400/30 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-400/50 resize-none transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 pt-1">
                {!rejecting ? (
                  <>
                    <button
                      onClick={() => onApprove(campaign.id)}
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
                      onClick={() => { setRejecting(false); setReason(""); }}
                      className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      Cancelar
                    </button>
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

export function CampaignApprovalsClient({
  initialCampaigns,
}: {
  initialCampaigns: PendingCampaign[];
}) {
  const [campaigns, setCampaigns] = useState<PendingCampaign[]>(initialCampaigns);
  const [, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      try {
        await approveCampaign(id);
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        toast.success("Campaña aprobada.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al aprobar la campaña.");
      }
    });
  };

  const handleReject = (id: string, reason: string) => {
    startTransition(async () => {
      try {
        await rejectCampaign(id, reason);
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        toast.error("Campaña rechazada.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al rechazar la campaña.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-yellow-400/10 flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-[15px] font-bold text-white">Campañas pendientes de aprobación</h2>
          <p className="text-[12px] text-white/40">
            {campaigns.length === 0
              ? "No hay campañas esperando revisión."
              : `${campaigns.length} campaña${campaigns.length !== 1 ? "s" : ""} en espera de tu revisión.`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {campaigns.map((c) => (
            <CampaignRow
              key={c.id}
              campaign={c}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </AnimatePresence>

        {campaigns.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center rounded-2xl bg-[#0F0F0F] border border-white/[0.06]"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.04] text-white/20 mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm text-white/30">¡Todo al día! No hay campañas pendientes.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
