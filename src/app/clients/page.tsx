"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Building2, Search, Plus, Globe, Phone,
  Mail, TrendingUp, DollarSign, Layers, X,
  ArrowUpRight, CheckCircle2, XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { mockClients, mockCampaigns } from "@/lib/mock-data";
import { formatCurrency, getInitials, cn } from "@/lib/utils";
import type { Client } from "@/types";

const INDUSTRIES = ["Todas", "Retail", "Bebidas", "Alimentos", "Fintech", "Telecomunicaciones"];

const CLIENT_COLORS = [
  "from-[#B8EB23] to-[#8FBA10]",
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-orange-400 to-orange-600",
  "from-pink-400 to-pink-600",
];

function ClientCard({ client, index }: { client: Client; index: number }) {
  const campaigns = mockCampaigns.filter((c) => c.clientId === client.id);
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const budgetUsedPct = client.creditLimit > 0
    ? Math.min(100, Math.round((totalSpent / client.creditLimit) * 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group rounded-xl border border-white/[0.06] bg-[#111111] hover:border-white/10 hover:bg-[#141414] transition-all cursor-pointer overflow-hidden"
    >
      {/* Top accent */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${CLIENT_COLORS[index % CLIENT_COLORS.length]}`} />

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 bg-gradient-to-br",
            client.isActive ? CLIENT_COLORS[index % CLIENT_COLORS.length] : "from-white/10 to-white/5",
            client.isActive ? "text-black" : "text-white/40"
          )}>
            {getInitials(client.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-white leading-tight group-hover:text-[#B8EB23] transition-colors">
                {client.name}
              </p>
              <div className="flex-shrink-0">
                {client.isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400/60" />
                )}
              </div>
            </div>
            {client.industry && (
              <Badge variant="outline" size="sm" className="mt-1">{client.industry}</Badge>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
          {client.city && (
            <div className="flex items-center gap-2 text-[11px] text-white/40">
              <Globe className="w-3 h-3 flex-shrink-0" />
              <span>{client.city}, {client.country}</span>
            </div>
          )}
        </div>

        {/* Credit usage */}
        {client.creditLimit > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/40">Crédito usado</span>
              <span className={cn("font-semibold", budgetUsedPct > 80 ? "text-red-400" : "text-white")}>
                {budgetUsedPct}%
              </span>
            </div>
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${budgetUsedPct}%` }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.05 }}
                className={cn(
                  "h-full rounded-full",
                  budgetUsedPct > 80 ? "bg-red-400" : "bg-[#B8EB23]"
                )}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/25">
              <span>{formatCurrency(totalSpent)} usado</span>
              <span>{formatCurrency(client.creditLimit)} límite</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06]">
          {[
            { label: "Campañas", value: campaigns.length },
            { label: "Activas", value: activeCampaigns.length },
            { label: "Usuarios", value: client._count?.users ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-sm font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-white/35">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end pt-1 border-t border-white/[0.04]">
          <button className="text-xs text-white/30 hover:text-[#B8EB23] transition-colors flex items-center gap-1">
            Ver detalles <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("Todas");

  const filtered = useMemo(() => {
    let list = [...mockClients];
    if (search) list = list.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    );
    if (industry !== "Todas") list = list.filter((c) => c.industry === industry);
    return list;
  }, [search, industry]);

  const activeCount = mockClients.filter((c) => c.isActive).length;
  const totalCredit = mockClients.reduce((s, c) => s + c.creditLimit, 0);
  const totalCampaigns = mockCampaigns.length;

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total clientes" value={mockClients.length} icon={<Building2 className="w-5 h-5" />} index={0} />
        <MetricCard title="Clientes activos" value={activeCount} icon={<CheckCircle2 className="w-5 h-5" />} highlight index={1} />
        <MetricCard title="Crédito total gestionado" value={formatCurrency(totalCredit)} icon={<DollarSign className="w-5 h-5" />} index={2} />
        <MetricCard title="Campañas totales" value={totalCampaigns} icon={<Layers className="w-5 h-5" />} index={3} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#B8EB23]/40 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              onClick={() => setIndustry(ind)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                industry === ind
                  ? "bg-[#B8EB23]/10 text-[#B8EB23] border border-[#B8EB23]/20"
                  : "text-white/40 hover:text-white border border-transparent"
              )}
            >
              {ind}
            </button>
          ))}
        </div>

        <Button variant="brand" size="sm" icon={<Plus className="w-4 h-4" />} className="ml-auto">
          Nuevo cliente
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((client, i) => (
          <ClientCard key={client.id} client={client} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-white/30">No se encontraron clientes.</p>
        </div>
      )}
    </div>
  );
}
