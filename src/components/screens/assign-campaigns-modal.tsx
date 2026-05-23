"use client";

import { useState, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Layers, CheckCircle2, Circle,
  Plus, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import {
  assignCampaignsToScreen,
  getOrgCampaignsForAssignment,
} from "@/actions/screen-campaigns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────
 * AssignCampaignsModal — multi-select campaign assignment panel.
 *
 * Opens as a sheet anchored to the bottom on mobile, centered dialog on
 * desktop. Fetches campaigns lazily on first open so the parent page
 * doesn't need to pre-load them.
 *
 * Props:
 *   screenId         — the screen being managed
 *   screenName       — shown in header for context
 *   assignedIds      — currently assigned campaign IDs (pre-selected)
 * ────────────────────────────────────────────────────────────────────── */

type Campaign = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  client: { name: string } | null;
  orgName: string | null;
  createdBy: string | null;
};

interface Props {
  screenId: string;
  screenName: string;
  assignedIds: string[];
  onSuccess?: () => void;
}

const STATUS_ORDER: Record<string, number> = {
  ACTIVE: 0, PENDING_APPROVAL: 1, PAUSED: 2, DRAFT: 3, COMPLETED: 4, CANCELLED: 5,
};

function campaignSort(a: Campaign, b: Campaign) {
  const oa = STATUS_ORDER[a.status] ?? 9;
  const ob = STATUS_ORDER[b.status] ?? 9;
  return oa !== ob ? oa - ob : a.name.localeCompare(b.name);
}

export function AssignCampaignsModal({ screenId, screenName, assignedIds, onSuccess }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedIds));
  const [isPending, startTransition] = useTransition();

  const handleOpen = useCallback(async () => {
    setOpen(true);
    setSelected(new Set(assignedIds));
    if (campaigns.length === 0) {
      setLoading(true);
      try {
        const data = await getOrgCampaignsForAssignment();
        setCampaigns(data.sort(campaignSort));
      } catch {
        toast.error("No se pudieron cargar las campañas");
      } finally {
        setLoading(false);
      }
    }
  }, [assignedIds, campaigns.length]);

  const handleClose = () => {
    setOpen(false);
    setSearch("");
  };

  const toggleCampaign = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await assignCampaignsToScreen(screenId, Array.from(selected));
        toast.success(`Campañas asignadas a ${screenName}`);
        handleClose();
        router.refresh();
        onSuccess?.();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al asignar campañas");
      }
    });
  };

  const filtered = campaigns.filter((c) =>
    search
      ? c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.client?.name.toLowerCase().includes(search.toLowerCase()) ?? false)
      : true,
  );

  const changedCount = (() => {
    const orig = new Set(assignedIds);
    let diff = 0;
    selected.forEach((id) => { if (!orig.has(id)) diff++; });
    orig.forEach((id)    => { if (!selected.has(id)) diff++; });
    return diff;
  })();

  return (
    <>
      {/* Trigger */}
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[#B8EB23]/25 bg-[#B8EB23]/[0.06] text-[#B8EB23] hover:bg-[#B8EB23]/[0.12] transition-all"
      >
        <Plus className="w-3 h-3" />
        Asignar
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[520px] max-h-[82vh] flex flex-col bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl z-[61] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#B8EB23]/10 flex items-center justify-center text-[#B8EB23]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Asignar campañas</h3>
                    <p className="text-[11px] text-white/40 mt-0.5 truncate max-w-[240px]">{screenName}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="px-5 py-3 border-b border-white/[0.06] flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar campaña o cliente…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Campaign list */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-5 h-5 rounded-full border-2 border-[#B8EB23]/30 border-t-[#B8EB23] animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <Layers className="w-8 h-8 text-white/20" />
                    <p className="text-xs text-white/30">
                      {search ? "Sin resultados" : "No hay campañas en esta organización"}
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    {filtered.map((campaign) => {
                      const isSelected = selected.has(campaign.id);
                      const wasAssigned = assignedIds.includes(campaign.id);
                      return (
                        <button
                          key={campaign.id}
                          onClick={() => toggleCampaign(campaign.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-5 py-3 text-left transition-colors",
                            isSelected
                              ? "bg-[#B8EB23]/[0.06] hover:bg-[#B8EB23]/[0.09]"
                              : "hover:bg-white/[0.03]",
                          )}
                        >
                          {/* Checkbox */}
                          <div className="flex-shrink-0 mt-0.5">
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-[#B8EB23]" />
                            ) : (
                              <Circle className="w-4 h-4 text-white/25" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white truncate">
                                {campaign.name}
                              </span>
                              {wasAssigned && !isSelected && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-red-400/70 flex-shrink-0">
                                  Quitar
                                </span>
                              )}
                              {!wasAssigned && isSelected && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#B8EB23]/70 flex-shrink-0">
                                  Nuevo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {campaign.orgName && (
                                <span className="text-[11px] font-medium text-[#B8EB23]/50 truncate max-w-[120px]">{campaign.orgName}</span>
                              )}
                              {campaign.client && (
                                <>
                                  {campaign.orgName && <span className="text-white/15 text-[11px]">·</span>}
                                  <span className="text-[11px] text-white/40 truncate">{campaign.client.name}</span>
                                </>
                              )}
                              {campaign.createdBy && !campaign.client && (
                                <span className="text-[11px] text-white/35 truncate">{campaign.createdBy}</span>
                              )}
                              <span className="text-white/15 text-[11px]">·</span>
                              <span className="text-[11px] text-white/30 flex-shrink-0">
                                hasta {new Date(campaign.endDate).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                              </span>
                            </div>
                          </div>

                          {/* Status badge */}
                          <div className="flex-shrink-0">
                            <StatusBadge status={campaign.status} size="sm" />
                          </div>

                          <ChevronRight className={cn("w-3 h-3 flex-shrink-0 transition-colors", isSelected ? "text-[#B8EB23]/60" : "text-white/15")} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-white/[0.06] flex items-center gap-3 flex-shrink-0 bg-gradient-to-t from-white/[0.02] to-transparent">
                <div className="flex-1 text-[11px] text-white/40">
                  {selected.size} campaña{selected.size !== 1 ? "s" : ""} seleccionada{selected.size !== 1 ? "s" : ""}
                  {changedCount > 0 && (
                    <span className="ml-1.5 text-[#B8EB23]/70">· {changedCount} cambio{changedCount !== 1 ? "s" : ""}</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  variant="brand"
                  size="sm"
                  onClick={handleSubmit}
                  loading={isPending}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Guardar
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
