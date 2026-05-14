"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Building2, Search, Plus, Globe,
  Mail, DollarSign, Layers, X,
  CheckCircle2, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { NoClientsEmpty, NoSearchResults } from "@/components/ui/empty-state";
import { ClientFormModal } from "@/components/forms/client-form";
import { formatCurrency, getInitials, cn } from "@/lib/utils";

const INDUSTRIES = ["Todas", "Retail", "Bebidas", "Alimentos", "Fintech", "Telecomunicaciones"];

const CLIENT_COLORS = [
  "from-[#B8EB23] to-[#8FBA10]",
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-orange-400 to-orange-600",
  "from-pink-400 to-pink-600",
];

type Client = {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
  email: string;
  city?: string | null;
  country: string;
  isActive: boolean;
  creditLimit: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
  _count?: { campaigns: number; users: number } | null;
};

function ClientCard({ client, index }: { client: Client; index: number }) {
  const campaignCount = client._count?.campaigns ?? 0;
  const userCount = client._count?.users ?? 0;
  const creditUsed = client.creditLimit - client.balance;
  const budgetUsedPct = client.creditLimit > 0
    ? Math.min(100, Math.round((creditUsed / client.creditLimit) * 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group rounded-xl border border-white/[0.06] bg-[#111111] hover:border-white/10 hover:bg-[#141414] transition-all cursor-pointer overflow-hidden"
    >
      <div className={`h-0.5 w-full bg-gradient-to-r ${CLIENT_COLORS[index % CLIENT_COLORS.length]}`} />

      <div className="p-4 space-y-4">
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
                className={cn("h-full rounded-full", budgetUsedPct > 80 ? "bg-red-400" : "bg-[#B8EB23]")}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/25">
              <span>{formatCurrency(creditUsed)} usado</span>
              <span>{formatCurrency(client.creditLimit)} límite</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06]">
          {[
            { label: "Campañas", value: campaignCount },
            { label: "Balance", value: formatCurrency(client.balance) },
            { label: "Usuarios", value: userCount },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-sm font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-white/35">{stat.label}</p>
            </div>
          ))}
        </div>

      </div>
    </motion.div>
  );
}

interface ClientsClientProps {
  clients: Client[];
  totalCampaigns: number;
  canManage?: boolean;
}

export function ClientsClient({ clients, totalCampaigns, canManage = false }: ClientsClientProps) {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("Todas");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = useMemo(() => {
    let list = [...clients];
    if (search) list = list.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    );
    if (industry !== "Todas") list = list.filter((c) => c.industry === industry);
    return list;
  }, [search, industry, clients]);

  const activeCount = clients.filter((c) => c.isActive).length;
  const totalCredit = clients.reduce((s, c) => s + c.creditLimit, 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1400px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <MetricCard title="Total clientes" value={clients.length} icon={<Building2 className="w-5 h-5" />} index={0} />
        <MetricCard title="Clientes activos" value={activeCount} icon={<CheckCircle2 className="w-5 h-5" />} highlight index={1} />
        <MetricCard title="Crédito total gestionado" value={formatCurrency(totalCredit)} icon={<DollarSign className="w-5 h-5" />} index={2} />
        <MetricCard title="Campañas totales" value={totalCampaigns} icon={<Layers className="w-5 h-5" />} index={3} />
      </div>

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

        <div className="flex items-center gap-1 flex-wrap">
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

        {canManage && (
          <Button
            variant="brand"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            className="ml-auto flex-shrink-0"
            onClick={() => setShowCreateModal(true)}
          >
            Nuevo cliente
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((client, i) => (
          <ClientCard key={client.id} client={client} index={i} />
        ))}
      </div>

      {filtered.length === 0 && clients.length === 0 && <NoClientsEmpty />}
      {filtered.length === 0 && clients.length > 0 && <NoSearchResults query={search || industry} />}

      <ClientFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </div>
  );
}
