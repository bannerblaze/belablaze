"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus, TrendingUp, DollarSign, Layers, Eye, X, ArrowUpRight, CreditCard, RefreshCw,
} from "lucide-react";
import { createPaymentReference } from "@/actions/payments";
import { toast } from "@/lib/toast";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { NoCampaignsEmpty, NoSearchResults } from "@/components/ui/empty-state";
import { formatCurrency, formatNumber, formatDate, cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "all",              label: "Todas"      },
  { value: "ACTIVE",           label: "Activas"    },
  { value: "APPROVED",         label: "Aprobadas"  },
  { value: "PENDING_APPROVAL", label: "Pendientes" },
  { value: "DRAFT",            label: "Borradores" },
  { value: "PAUSED",           label: "Pausadas"   },
  { value: "COMPLETED",        label: "Completadas"},
];

type Campaign = {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  conversions: number;
  engagements: number;
  startDate: string;
  endDate: string;
  client?: { name: string } | null;
};

interface CampaignsClientProps {
  campaigns: Campaign[];
}

export function CampaignsClient({ campaigns }: CampaignsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [payingId, setPayingId] = useState<string | null>(null);

  const handlePay = async (campaign: Campaign, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPayingId(campaign.id);
    try {
      const data = await createPaymentReference(campaign.id);

      // Load Wompi widget script once
      if (!document.querySelector('script[src*="wompi"]')) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.wompi.co/widget.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("No se pudo cargar el widget de pago"));
          document.body.appendChild(script);
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const checkout = new (window as any).WidgetCheckout({
        currency:      data.currency,
        amountInCents: data.amountInCents,
        reference:     data.reference,
        publicKey:     data.publicKey,
        signature:     { integrity: data.signature },
        redirectUrl:   data.redirectUrl,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      checkout.open((result: any) => {
        setPayingId(null);
        if (result?.transaction?.status === "APPROVED") {
          toast.success("Pago aprobado. Activando campaña...");
          router.refresh();
        }
      });
    } catch (err) {
      setPayingId(null);
      toast.error(err instanceof Error ? err.message : "Error al procesar el pago");
    }
  };

  const filtered = useMemo(() => {
    let list = [...campaigns];
    if (search) list = list.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.client?.name?.toLowerCase().includes(search.toLowerCase())
    );
    if (status !== "all") list = list.filter((c) => c.status === status);
    return list;
  }, [search, status, campaigns]);

  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const activeCount = campaigns.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1400px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <MetricCard title="Total campañas" value={campaigns.length} icon={<Layers className="w-5 h-5" />} index={0} />
        <MetricCard title="Campañas activas" value={activeCount} icon={<TrendingUp className="w-5 h-5" />} highlight index={1} />
        <MetricCard title="Presupuesto total" value={formatCurrency(totalBudget)} icon={<DollarSign className="w-5 h-5" />} index={2} />
        <MetricCard title="Impresiones totales" value={totalImpressions} icon={<Eye className="w-5 h-5" />} index={3} />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-white/[0.06]">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Buscar campaña o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 pr-9 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#B8EB23]/40 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  status === tab.value
                    ? "bg-[#B8EB23]/10 text-[#B8EB23] border border-[#B8EB23]/20"
                    : "text-white/40 hover:text-white border border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link href="/campaigns/new" className="ml-auto flex-shrink-0">
            <Button variant="brand" size="sm" icon={<Plus className="w-4 h-4" />}>
              Nueva campaña
            </Button>
          </Link>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((campaign, i) => {
              const pct = campaign.budget > 0 ? Math.min(100, Math.round((campaign.spent / campaign.budget) * 100)) : 0;
              const daysLeft = Math.max(0, Math.ceil(
                // eslint-disable-next-line react-hooks/purity
                (new Date(campaign.endDate).getTime() - Date.now()) / 86400000
              ));

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link href={`/campaigns/${campaign.id}`}>
                    <div className="group rounded-xl border border-white/[0.06] bg-[#111111] hover:border-white/10 hover:bg-[#141414] transition-all cursor-pointer p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white leading-snug group-hover:text-[#B8EB23] transition-colors">
                            {campaign.name}
                          </p>
                          <p className="text-xs text-white/40 mt-0.5">{campaign.client?.name}</p>
                        </div>
                        <StatusBadge status={campaign.status} size="sm" showDot />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">Presupuesto usado</span>
                          <span className={cn("font-semibold", pct > 90 ? "text-red-400" : "text-white")}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                            className={cn(
                              "h-full rounded-full",
                              pct > 90 ? "bg-red-400" : pct > 70 ? "bg-yellow-400" : "bg-[#B8EB23]"
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-white/30">
                          <span>{formatCurrency(campaign.spent)} gastado</span>
                          <span>{formatCurrency(campaign.budget)} total</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/[0.06]">
                        {[
                          { label: "Impresiones", value: formatNumber(campaign.impressions, true) },
                          { label: "Conversiones", value: formatNumber(campaign.conversions, true) },
                          { label: "Días restantes", value: campaign.status === "COMPLETED" ? "—" : `${daysLeft}d` },
                        ].map((stat) => (
                          <div key={stat.label} className="text-center">
                            <p className="text-sm font-bold text-white">{stat.value}</p>
                            <p className="text-[10px] text-white/35 mt-0.5">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                        <span className="text-[11px] text-white/30">
                          {formatDate(campaign.startDate, "dd MMM")} → {formatDate(campaign.endDate, "dd MMM yyyy")}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-[#B8EB23] transition-colors" />
                      </div>

                      {campaign.status === "APPROVED" && campaign.budget > 0 && (
                        <div
                          className="pt-2 border-t border-[#B8EB23]/10"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                          <button
                            type="button"
                            disabled={payingId === campaign.id}
                            onClick={(e) => handlePay(campaign, e)}
                            className="w-full py-2 px-3 rounded-lg bg-[#B8EB23] text-black text-xs font-bold hover:bg-[#C5F034] active:bg-[#A5D820] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-[0_0_16px_-2px_rgba(184,235,35,0.4)]"
                          >
                            {payingId === campaign.id ? (
                              <><RefreshCw className="w-3 h-3 animate-spin" /> Procesando...</>
                            ) : (
                              <><CreditCard className="w-3 h-3" /> Pagar campaña</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && campaigns.length === 0 && <NoCampaignsEmpty />}
          {filtered.length === 0 && campaigns.length > 0 && <NoSearchResults query={search || status} />}
        </div>
      </Card>
    </div>
  );
}
