"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2, Plus, Trash2, Mail, Phone, Briefcase,
  MapPin, BarChart2, Search, X, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { deleteClient } from "@/actions/clients";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  industry: string | null;
  city: string | null;
  createdAt: string;
  _count: { campaigns: number };
};

interface Props {
  clients: Client[];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function ClientsClient({ clients }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = clients.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  const onDelete = (id: string, name: string) => {
    if (!confirm(`¿Eliminar el cliente "${name}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      try {
        await deleteClient(id);
        toast.success("Cliente eliminado");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al eliminar cliente");
      }
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1200px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-3 flex-wrap"
      >
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Clientes</h1>
          <p className="text-xs text-white/40 mt-0.5">
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} registrado{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => router.push("/clients/new")}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Nuevo cliente
        </Button>
      </motion.div>

      {/* Search */}
      {clients.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clientes..."
            className="w-full h-10 pl-9 pr-9 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/[0.12] transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#B8EB23]/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-[#B8EB23]/60" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Sin clientes aún</p>
            <p className="text-xs text-white/40 mb-5">Crea tu primer cliente para poder asignarlo a campañas.</p>
            <Button onClick={() => router.push("/clients/new")} icon={<Plus className="w-3.5 h-3.5" />}>
              Crear primer cliente
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-white/40">Sin resultados para &ldquo;{query}&rdquo;</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="group relative rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all overflow-hidden p-4 space-y-3"
            >
              {/* Name + icon */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#B8EB23]/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-[#B8EB23]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{client.name}</p>
                    {client.industry && (
                      <p className="text-[11px] text-white/40 truncate">{client.industry}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(client.id, client.name)}
                  disabled={isPending}
                  className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  title="Eliminar cliente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-1.5">
                {client.email && (
                  <div className="flex items-center gap-2 text-[11px] text-white/50">
                    <Mail className="w-3 h-3 flex-shrink-0 text-white/30" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-[11px] text-white/50">
                    <Phone className="w-3 h-3 flex-shrink-0 text-white/30" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.city && (
                  <div className="flex items-center gap-2 text-[11px] text-white/50">
                    <MapPin className="w-3 h-3 flex-shrink-0 text-white/30" />
                    <span>{client.city}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-1.5 text-[11px] text-white/35">
                  <BarChart2 className="w-3 h-3" />
                  <span>{client._count.campaigns} campaña{client._count.campaigns !== 1 ? "s" : ""}</span>
                </div>
                <span className="text-[10px] text-white/25">{fmtDate(client.createdAt)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
