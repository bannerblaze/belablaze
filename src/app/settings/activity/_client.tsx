"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity, ChevronLeft, ChevronRight, Download,
  User as UserIcon, Building2, Megaphone, MonitorPlay,
  CreditCard, Image as ImageIcon, Shield, Key,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";

const ENTITY_FILTERS = [
  { value: "", label: "Todos" },
  { value: "Campaign", label: "Campañas" },
  { value: "Ad", label: "Anuncios" },
  { value: "Screen", label: "Pantallas" },
  { value: "Client", label: "Clientes" },
  { value: "OrganizationMember", label: "Miembros" },
  { value: "Invitation", label: "Invitaciones" },
  { value: "MediaAsset", label: "Media" },
  { value: "Subscription", label: "Facturación" },
];

type Item = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null } | null;
};

interface Props {
  items: Item[];
  total: number;
  page: number;
  totalPages: number;
}

function iconForEntity(entityType: string) {
  switch (entityType) {
    case "Organization": return Building2;
    case "OrganizationMember":
    case "Invitation": return UserIcon;
    case "Campaign":
    case "Ad": return Megaphone;
    case "Screen": return MonitorPlay;
    case "Client": return Building2;
    case "MediaAsset": return ImageIcon;
    case "Subscription": return CreditCard;
    case "ApiKey":
    case "Webhook": return Key;
    default: return Shield;
  }
}

function actionColor(action: string): string {
  if (action.endsWith(".delete") || action.endsWith(".remove")) return "text-red-300 bg-red-400/[0.08]";
  if (action.endsWith(".create") || action.endsWith(".invite")) return "text-[#B8EB23] bg-[#B8EB23]/[0.08]";
  if (action.endsWith(".update") || action.endsWith(".switch")) return "text-blue-300 bg-blue-400/[0.08]";
  if (action.endsWith(".approve") || action.endsWith(".accept")) return "text-[#B8EB23] bg-[#B8EB23]/[0.08]";
  if (action.endsWith(".reject") || action.endsWith(".revoke") || action.endsWith(".pause")) return "text-amber-300 bg-amber-400/[0.08]";
  return "text-white/60 bg-white/[0.04]";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(iso).toLocaleDateString("es-CO");
}

export function ActivityClient({ items, total, page, totalPages }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeEntity = searchParams.get("entityType") ?? "";
  const [expanded, setExpanded] = useState<string | null>(null);

  const setEntityFilter = (entityType: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (entityType) sp.set("entityType", entityType);
    else sp.delete("entityType");
    sp.delete("page");
    router.push(`/settings/activity${sp.toString() ? `?${sp}` : ""}`);
  };

  const buildPageUrl = (target: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(target));
    return `/settings/activity?${sp.toString()}`;
  };

  const exportCsv = () => {
    const rows = [
      ["timestamp", "user", "action", "entity", "entityId", "ip"],
      ...items.map((i) => [
        i.createdAt,
        i.user?.email ?? "—",
        i.action,
        i.entityType,
        i.entityId ?? "—",
        i.ip ?? "—",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#B8EB23]" />
            Audit log
          </h2>
          <p className="text-xs text-white/40 mt-0.5">{total.toLocaleString()} eventos registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={exportCsv}>
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Entity filter chips */}
      <div className="flex items-center gap-1 flex-wrap">
        {ENTITY_FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => setEntityFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              activeEntity === f.value
                ? "bg-[#B8EB23]/10 text-[#B8EB23] border border-[#B8EB23]/20"
                : "text-white/40 hover:text-white border border-transparent",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-1 pb-1">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-white/40">Aún no hay actividad registrada</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {items.map((i, idx) => {
                const Icon = iconForEntity(i.entityType);
                const isOpen = expanded === i.id;
                return (
                  <motion.div
                    key={i.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.4) }}
                    className="px-2"
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : i.id)}
                      className="w-full flex items-center gap-3 py-3 text-left hover:bg-white/[0.02] rounded-lg transition-all"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <code className={cn("text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded", actionColor(i.action))}>
                            {i.action}
                          </code>
                          <span className="text-xs text-white/60 truncate">{i.entityType}</span>
                          {i.entityId && (
                            <code className="text-[10px] text-white/30 font-mono truncate">{i.entityId.slice(0, 12)}…</code>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-white/40">
                          {i.user ? (
                            <span className="flex items-center gap-1.5">
                              {i.user.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={i.user.avatar} alt="" className="w-3.5 h-3.5 rounded-full" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full bg-[#B8EB23]/20 text-[#B8EB23] flex items-center justify-center text-[7px] font-bold">
                                  {getInitials(i.user.name)}
                                </div>
                              )}
                              {i.user.email}
                            </span>
                          ) : (
                            <span>Sistema</span>
                          )}
                          <span>·</span>
                          <span>{timeAgo(i.createdAt)}</span>
                          {i.ip && <><span>·</span><span className="font-mono">{i.ip}</span></>}
                        </div>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-12 pb-4 pt-1">
                        <div className="rounded-lg bg-black/40 border border-white/[0.04] p-3 text-[11px] font-mono text-white/60 overflow-auto">
                          <pre>{JSON.stringify(i.metadata ?? {}, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>Página {page} de {totalPages}</span>
          <div className="flex items-center gap-2">
            <Link
              href={buildPageUrl(Math.max(1, page - 1))}
              className={cn(
                "p-1.5 rounded-lg",
                page <= 1 ? "text-white/20 pointer-events-none" : "text-white/60 hover:bg-white/[0.05]",
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <Link
              href={buildPageUrl(Math.min(totalPages, page + 1))}
              className={cn(
                "p-1.5 rounded-lg",
                page >= totalPages ? "text-white/20 pointer-events-none" : "text-white/60 hover:bg-white/[0.05]",
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
