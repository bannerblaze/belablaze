"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Plus, Mail, Phone, MapPin, BarChart2, Search, X, Users,
  Globe, CreditCard, ChevronRight, Clock, Activity, FileText,
  CheckCircle2, XCircle, Loader2, Landmark, Coins, User2,
  Pencil, Trash2, ExternalLink, ArrowUpRight, CalendarDays,
  TrendingUp, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { deleteClient, getClientDetail } from "@/actions/clients";
import type { ClientDetail } from "@/actions/clients";

type ClientRow = {
  id: string;
  name: string;
  logo: string | null;
  email: string;
  phone: string | null;
  industry: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  users: { role: string }[];
  _count: { campaigns: number };
};

interface Props {
  clients: ClientRow[];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function clientType(users: { role: string }[]) {
  return users.some((u) => u.role === "CREATOR") ? "Creador" : "Empresa";
}

function Initials({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const parts = name.trim().split(/\s+/);
  const letters = parts.length >= 2
    ? parts[0][0] + parts[1][0]
    : name.slice(0, 2);
  const sz = size === "sm" ? "w-8 h-8 text-[11px]" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  return (
    <div className={cn("rounded-xl bg-[#B8EB23]/10 flex items-center justify-center flex-shrink-0 font-bold text-[#B8EB23] uppercase", sz)}>
      {letters.toUpperCase()}
    </div>
  );
}

/* ─── Detail Drawer ───────────────────────────────────────────────────── */

type DrawerTab = "info" | "campaigns" | "activity";

function DetailDrawer({
  clientId,
  onClose,
  onDeleted,
}: {
  clientId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DrawerTab>("info");
  const [deleting, startDelete] = useTransition();
  const router = useRouter();

  // Load on mount
  useEffect(() => {
    getClientDetail(clientId).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [clientId]);

  const handleDelete = () => {
    if (!data) return;
    if (!confirm(`¿Eliminar la cuenta "${data.name}"? Esta acción no se puede deshacer.`)) return;
    startDelete(async () => {
      try {
        await deleteClient(data.id);
        toast.success("Cuenta eliminada");
        onDeleted();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  };

  const activeCampaigns = data?.campaigns.filter((c) => c.status === "ACTIVE").length ?? 0;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40"
      />

      {/* Panel */}
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[520px] z-50 flex flex-col bg-[#0A0A0A] border-l border-white/[0.07] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {loading ? (
              <div className="w-14 h-14 rounded-xl bg-white/[0.04] animate-pulse flex-shrink-0" />
            ) : data?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.logo} alt={data.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <Initials name={data?.name ?? "?"} size="lg" />
            )}
            <div className="min-w-0">
              {loading ? (
                <div className="h-5 w-36 rounded bg-white/[0.06] animate-pulse mb-2" />
              ) : (
                <>
                  <h2 className="text-base font-bold text-white truncate">{data?.name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant={data?.isActive ? "success" : "danger"} size="sm">
                      {data?.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                    <Badge
                      variant={data && clientType(data.users) === "Creador" ? "brand" : "info"}
                      size="sm"
                    >
                      {data ? clientType(data.users) : "—"}
                    </Badge>
                    {data?.industry && (
                      <span className="text-[10px] text-white/35">{data.industry}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick stats */}
        {!loading && data && (
          <div className="grid grid-cols-3 gap-px bg-white/[0.04] border-b border-white/[0.06] flex-shrink-0">
            {[
              { label: "Campañas", value: data._count.campaigns, icon: <BarChart2 className="w-3.5 h-3.5" /> },
              { label: "Activas", value: activeCampaigns, icon: <TrendingUp className="w-3.5 h-3.5" /> },
              { label: "Usuarios", value: data._count.users, icon: <Users className="w-3.5 h-3.5" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-[#0A0A0A] px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-white/30 mb-1">{icon}</div>
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-[10px] text-white/35">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 pb-0 flex-shrink-0">
          {(["info", "campaigns", "activity"] as DrawerTab[]).map((t) => {
            const labels: Record<DrawerTab, string> = { info: "Información", campaigns: "Campañas", activity: "Actividad" };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  tab === t
                    ? "bg-[#B8EB23]/10 text-[#B8EB23] border border-[#B8EB23]/20"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                )}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : !data ? (
            <div className="py-16 text-center text-white/30 text-sm">No se pudo cargar la información</div>
          ) : tab === "info" ? (
            <InfoTab data={data} />
          ) : tab === "campaigns" ? (
            <CampaignsTab campaigns={data.campaigns} />
          ) : (
            <ActivityTab logs={data.auditLogs} />
          )}
        </div>

        {/* Footer actions */}
        {!loading && data && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/[0.06] flex-shrink-0">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Eliminar cuenta
            </button>
            <button
              onClick={() => router.push(`/clients/new?edit=${data.id}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
}

function InfoTab({ data }: { data: ClientDetail }) {
  const rows: { icon: React.ReactNode; label: string; value: string | null }[] = [
    { icon: <Mail className="w-3.5 h-3.5" />, label: "Correo", value: data.email },
    { icon: <Phone className="w-3.5 h-3.5" />, label: "Teléfono", value: data.phone },
    { icon: <MapPin className="w-3.5 h-3.5" />, label: "Ciudad", value: data.city ? `${data.city}, ${data.country}` : null },
    { icon: <FileText className="w-3.5 h-3.5" />, label: "Dirección", value: data.address },
    { icon: <Globe className="w-3.5 h-3.5" />, label: "Sitio web", value: data.website },
    { icon: <Landmark className="w-3.5 h-3.5" />, label: "NIT / Tax ID", value: data.taxId },
  ].filter((r) => r.value);

  return (
    <div className="space-y-4">
      {/* Contact */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">Contacto</p>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] divide-y divide-white/[0.04]">
          {rows.length === 0 ? (
            <p className="px-4 py-3 text-xs text-white/30">Sin información de contacto</p>
          ) : rows.map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3">
              <span className="text-white/30">{icon}</span>
              <span className="text-[11px] text-white/40 w-20 flex-shrink-0">{label}</span>
              <span className="text-[12px] text-white/70 min-w-0 truncate">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Financial */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">Financiero</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
            <div className="flex items-center gap-1.5 text-white/30 mb-1">
              <CreditCard className="w-3.5 h-3.5" />
              <span className="text-[10px]">Límite de crédito</span>
            </div>
            <p className="text-sm font-bold text-white">{fmtCurrency(data.creditLimit)}</p>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
            <div className="flex items-center gap-1.5 text-white/30 mb-1">
              <Coins className="w-3.5 h-3.5" />
              <span className="text-[10px]">Balance</span>
            </div>
            <p className={cn("text-sm font-bold", data.balance < 0 ? "text-red-400" : "text-white")}>
              {fmtCurrency(data.balance)}
            </p>
          </div>
        </div>
      </section>

      {/* Users linked */}
      {data.users.length > 0 && (
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">Usuarios vinculados</p>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] divide-y divide-white/[0.04]">
            {data.users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <User2 className="w-3.5 h-3.5 text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-white/80 truncate">{u.name}</p>
                  <p className="text-[10px] text-white/35 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge variant={u.status === "ACTIVE" ? "success" : "danger"} size="sm">
                    {u.status === "ACTIVE" ? "Activo" : "Inactivo"}
                  </Badge>
                  <Badge variant="outline" size="sm">{u.role}</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Timestamps */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">Registro</p>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] divide-y divide-white/[0.04]">
          {[
            { label: "Creado", value: fmtDate(data.createdAt) },
            { label: "Actualizado", value: fmtDate(data.updatedAt) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[11px] text-white/35">{label}</span>
              <span className="text-[11px] text-white/60 font-mono">{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CampaignsTab({ campaigns }: { campaigns: ClientDetail["campaigns"] }) {
  if (campaigns.length === 0) {
    return (
      <div className="py-12 text-center">
        <BarChart2 className="w-8 h-8 text-white/15 mx-auto mb-3" />
        <p className="text-sm text-white/30">Sin campañas aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {campaigns.map((c) => {
        const spent = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0;
        return (
          <div
            key={c.id}
            className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 space-y-2"
          >
            <div className="flex items-start gap-2 justify-between">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-white/85 truncate">{c.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-white/30">
                  <CalendarDays className="w-3 h-3" />
                  <span>{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</span>
                </div>
              </div>
              <StatusBadge status={c.status} size="sm" />
            </div>
            {/* Budget bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-white/30">
                <span>Gasto {fmtCurrency(c.spent)} / {fmtCurrency(c.budget)}</span>
                <span>{c.impressions.toLocaleString("es-CO")} imp.</span>
              </div>
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#B8EB23] to-[#D4F564]"
                  style={{ width: `${spent}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  "client.create": "Cuenta creada",
  "client.update": "Datos actualizados",
  "client.delete": "Cuenta eliminada",
  "campaign.create": "Campaña creada",
  "campaign.update": "Campaña actualizada",
  "campaign.approve": "Campaña aprobada",
  "campaign.reject": "Campaña rechazada",
};

function ActivityTab({ logs }: { logs: ClientDetail["auditLogs"] }) {
  if (logs.length === 0) {
    return (
      <div className="py-12 text-center">
        <Activity className="w-8 h-8 text-white/15 mx-auto mb-3" />
        <p className="text-sm text-white/30">Sin actividad registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {logs.map((l) => (
        <div key={l.id} className="flex gap-3 py-2.5 border-b border-white/[0.04] last:border-none">
          <div className="w-1.5 h-1.5 rounded-full bg-[#B8EB23]/50 mt-2 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white/75">
              {ACTION_LABELS[l.action] ?? l.action}
            </p>
            {l.user && (
              <p className="text-[10px] text-white/35 truncate">por {l.user.name ?? l.user.email}</p>
            )}
            {l.metadata && Object.keys(l.metadata).length > 0 && (
              <p className="text-[10px] text-white/25 mt-0.5 font-mono truncate">
                {JSON.stringify(l.metadata).slice(0, 80)}
              </p>
            )}
          </div>
          <span className="text-[10px] text-white/25 flex-shrink-0 font-mono">
            {fmtDate(l.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main List ───────────────────────────────────────────────────────── */

export function ClientsClient({ clients }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const handleDeleted = useCallback(() => {
    setSelectedId(null);
    router.refresh();
  }, [router]);

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1200px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-3 flex-wrap"
        >
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Cuentas</h1>
            <p className="text-xs text-white/40 mt-0.5">
              {clients.length} cuenta{clients.length !== 1 ? "s" : ""} registrada{clients.length !== 1 ? "s" : ""}
              {" · "}{clients.filter((c) => c.isActive).length} activa{clients.filter((c) => c.isActive).length !== 1 ? "s" : ""}
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
              placeholder="Buscar cuentas..."
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
              <p className="text-sm font-semibold text-white mb-1">Sin cuentas aún</p>
              <p className="text-xs text-white/40 mb-5">Crea tu primera cuenta para poder asignarla a campañas.</p>
              <Button onClick={() => router.push("/clients/new")} icon={<Plus className="w-3.5 h-3.5" />}>
                Crear primera cuenta
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
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_100px_80px_80px_56px] gap-3 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.01]">
              {["Cuenta", "Contacto", "Tipo", "Estado", "Campañas", ""].map((h) => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-white/25">{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((client, i) => {
                const type = clientType(client.users);
                return (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedId(client.id)}
                    className={cn(
                      "group grid grid-cols-1 md:grid-cols-[2fr_1.5fr_100px_80px_80px_56px] gap-3 items-center px-4 py-3.5 cursor-pointer transition-all",
                      selectedId === client.id
                        ? "bg-[#B8EB23]/[0.04] border-l-2 border-l-[#B8EB23]/40"
                        : "hover:bg-white/[0.03]",
                    )}
                  >
                    {/* Account name + logo */}
                    <div className="flex items-center gap-3 min-w-0">
                      {client.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={client.logo} alt={client.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <Initials name={client.name} />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-[#B8EB23] transition-colors">
                          {client.name}
                        </p>
                        {client.industry && (
                          <p className="text-[11px] text-white/35 truncate">{client.industry}</p>
                        )}
                        {client.city && (
                          <p className="text-[11px] text-white/25 truncate md:hidden">{client.city}</p>
                        )}
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="hidden md:block min-w-0">
                      <p className="text-[12px] text-white/60 truncate">{client.email}</p>
                      {client.phone && (
                        <p className="text-[11px] text-white/30 truncate">{client.phone}</p>
                      )}
                      {client.city && (
                        <p className="text-[10px] text-white/25 truncate">{client.city}</p>
                      )}
                    </div>

                    {/* Type */}
                    <div className="hidden md:flex">
                      <Badge variant={type === "Creador" ? "brand" : "info"} size="sm">
                        {type}
                      </Badge>
                    </div>

                    {/* Status */}
                    <div className="hidden md:flex items-center gap-1.5">
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        client.isActive ? "bg-green-400" : "bg-white/20",
                      )} />
                      <span className={cn("text-[11px]", client.isActive ? "text-green-400/80" : "text-white/30")}>
                        {client.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </div>

                    {/* Campaign count */}
                    <div className="hidden md:flex items-center gap-1.5 text-[12px] text-white/40">
                      <BarChart2 className="w-3 h-3" />
                      {client._count.campaigns}
                    </div>

                    {/* Open button */}
                    <div className="hidden md:flex justify-end">
                      <span className="p-1.5 rounded-lg text-white/20 group-hover:text-[#B8EB23] group-hover:bg-[#B8EB23]/10 transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Mobile: full row summary */}
                    <div className="flex items-center justify-between gap-2 md:hidden">
                      <div className="flex items-center gap-2">
                        <Badge variant={type === "Creador" ? "brand" : "info"} size="sm">{type}</Badge>
                        <span className={cn("text-[11px]", client.isActive ? "text-green-400/80" : "text-white/30")}>
                          {client.isActive ? "Activa" : "Inactiva"}
                        </span>
                        <span className="text-[11px] text-white/30">{client._count.campaigns} campañas</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selectedId && (
          <DetailDrawer
            key={selectedId}
            clientId={selectedId}
            onClose={() => setSelectedId(null)}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>
    </>
  );
}
