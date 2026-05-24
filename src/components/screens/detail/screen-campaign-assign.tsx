"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  assignCampaignsToScreen,
  removeCampaignFromScreen,
  getOrgCampaignsForAssignment,
} from "@/actions/screen-campaigns";
import { StatusBadge } from "@/components/ui/badge";

type Campaign = Awaited<ReturnType<typeof getOrgCampaignsForAssignment>>[number];

/* ── Assign button + modal ─────────────────────────────────────────── */

interface AssignCampaignButtonProps {
  screenId: string;
  currentCampaignIds: string[];
}

export function AssignCampaignButton({ screenId, currentCampaignIds }: AssignCampaignButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openModal = async () => {
    setOpen(true);
    if (campaigns.length === 0) {
      setLoading(true);
      try {
        const data = await getOrgCampaignsForAssignment();
        setCampaigns(data);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssign = (campaignId: string) => {
    startTransition(async () => {
      try {
        await assignCampaignsToScreen(screenId, [...currentCampaignIds, campaignId]);
        toast.success("Campaña asignada a la pantalla");
        setOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al asignar campaña");
      }
    });
  };

  const available = campaigns.filter((c) => !currentCampaignIds.includes(c.id));

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#B8EB23]/10 border border-[#B8EB23]/20 text-[#B8EB23] text-xs font-medium hover:bg-[#B8EB23]/20 transition-colors"
      >
        <Plus className="w-3 h-3" />
        Asignar
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-hidden flex flex-col pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
                  <div>
                    <h3 className="text-base font-semibold text-white">Asignar campaña</h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      Selecciona una campaña para agregar a la playlist de esta pantalla
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.07] text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-5 h-5 rounded-full border-2 border-[#B8EB23]/30 border-t-[#B8EB23] animate-spin" />
                    </div>
                  ) : available.length === 0 ? (
                    <div className="text-center py-12">
                      <Layers className="w-8 h-8 text-white/15 mx-auto mb-3" />
                      <p className="text-sm text-white/40">
                        {campaigns.length === 0
                          ? "No hay campañas disponibles"
                          : "Todas las campañas ya están asignadas"}
                      </p>
                    </div>
                  ) : (
                    available.map((campaign) => (
                      <button
                        key={campaign.id}
                        onClick={() => handleAssign(campaign.id)}
                        disabled={isPending}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-[#B8EB23]/30 hover:bg-[#B8EB23]/[0.04] transition-all text-left group disabled:opacity-50"
                      >
                        <Layers className="w-4 h-4 text-white/30 group-hover:text-[#B8EB23]/60 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/80 truncate">{campaign.name}</p>
                          {campaign.client && (
                            <p className="text-[11px] text-white/40 truncate">{campaign.client.name}</p>
                          )}
                        </div>
                        <StatusBadge status={campaign.status} size="sm" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Remove button ─────────────────────────────────────────────────── */

interface RemoveCampaignButtonProps {
  screenId: string;
  campaignId: string;
}

export function RemoveCampaignButton({ screenId, campaignId }: RemoveCampaignButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      try {
        await removeCampaignFromScreen(screenId, campaignId);
        toast.success("Campaña removida de la pantalla");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al remover campaña");
      }
    });
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      title="Remover campaña"
      className="p-1 rounded-md hover:bg-red-400/10 text-white/20 hover:text-red-400 transition-colors disabled:opacity-40"
    >
      <X className="w-3 h-3" />
    </button>
  );
}
