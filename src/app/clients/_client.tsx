"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, X, Building2, UserCheck, ShieldCheck, ArrowUpDown,
} from "lucide-react";
import { UsersOverview } from "@/components/admin/users-overview";
import { OrgUsersTable } from "@/components/admin/org-users-table";
import { CreatorUsersTable } from "@/components/admin/creator-users-table";
import { cn } from "@/lib/utils";
import type {
  AdminOverview, AdminOrgUser, AdminCreatorUser, UserStatusKey,
} from "@/services/admin/users.service";

/* ──────────────────────────────────────────────────────────────────────
 * /clients — BannerBlaze internal admin panel.
 *
 * Single client orchestrator. Server hands us the full data; we run
 * search + status filter + sort + tab switching in the browser.
 *
 * Tabs: Empresas (ORGANIZATION accounts) | Creadores (PERSON accounts)
 * Filters: search (name/email), status pills, sort (recent / name /
 *          activity)
 *
 * No mutations here — read-only admin view. Future iterations may add
 * impersonation, status changes, drill-down to /clients/[id]. The
 * service layer is already platform-staff-gated so adding mutating
 * actions only requires adding the action file + button.
 * ────────────────────────────────────────────────────────────────────── */

type Tab = "ORGANIZATION" | "PERSON";
type SortKey = "recent" | "name" | "activity";

interface Props {
  overview: AdminOverview;
  orgUsers: AdminOrgUser[];
  creatorUsers: AdminCreatorUser[];
}

const STATUS_PILLS: Array<{ value: UserStatusKey | "ALL"; label: string; dot?: string }> = [
  { value: "ALL",       label: "Todos" },
  { value: "ACTIVE",    label: "Activos",      dot: "bg-[#B8EB23]" },
  { value: "NEW",       label: "Nuevos",       dot: "bg-[#B8EB23]" },
  { value: "INACTIVE",  label: "Inactivos",    dot: "bg-white/40" },
  { value: "SUSPENDED", label: "Suspendidos",  dot: "bg-red-400" },
];

export function ClientsClient({ overview, orgUsers, creatorUsers }: Props) {
  const [tab, setTab] = useState<Tab>("ORGANIZATION");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatusKey | "ALL">("ALL");
  const [sort, setSort] = useState<SortKey>("recent");

  const filteredOrgs = useMemo(() => {
    let list = [...orgUsers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orgName.toLowerCase().includes(q) ||
          o.ownerEmail.toLowerCase().includes(q) ||
          o.ownerName.toLowerCase().includes(q) ||
          o.slug.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "ALL") list = list.filter((o) => o.status === statusFilter);
    list.sort((a, b) => {
      switch (sort) {
        case "name":     return a.orgName.localeCompare(b.orgName);
        case "activity": return (b.lastLoginAt ?? "").localeCompare(a.lastLoginAt ?? "");
        case "recent":
        default:         return b.createdAt.localeCompare(a.createdAt);
      }
    });
    return list;
  }, [orgUsers, search, statusFilter, sort]);

  const filteredCreators = useMemo(() => {
    let list = [...creatorUsers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.category?.toLowerCase().includes(q) ?? false),
      );
    }
    if (statusFilter !== "ALL") list = list.filter((c) => c.status === statusFilter);
    list.sort((a, b) => {
      switch (sort) {
        case "name":     return a.displayName.localeCompare(b.displayName);
        case "activity": return (b.lastLoginAt ?? "").localeCompare(a.lastLoginAt ?? "");
        case "recent":
        default:         return b.createdAt.localeCompare(a.createdAt);
      }
    });
    return list;
  }, [creatorUsers, search, statusFilter, sort]);

  const activeFilters = (statusFilter !== "ALL" ? 1 : 0) + (search ? 1 : 0);
  const visibleCount = tab === "ORGANIZATION" ? filteredOrgs.length : filteredCreators.length;
  const totalCount = tab === "ORGANIZATION" ? orgUsers.length : creatorUsers.length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-6 max-w-[1500px]">
      {/* ───────── header ───────── */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight">
              Panel de cuentas
            </h1>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#B8EB23]/10 border border-[#B8EB23]/20 text-[9px] font-bold uppercase tracking-wider text-[#B8EB23]">
              <ShieldCheck className="w-2.5 h-2.5" />
              Interno
            </span>
          </div>
          <p className="text-xs text-white/45 max-w-xl">
            Administración de los usuarios registrados en BelaBlaze — empresas y creadores. Solo visible para personal de BannerBlaze.
          </p>
        </div>
      </motion.div>

      {/* ───────── overview ───────── */}
      <UsersOverview overview={overview} />

      {/* ───────── tabs + filter bar ───────── */}
      <section className="space-y-4">
        {/* Segmented tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center p-1 rounded-xl bg-[#0F0F0F] border border-white/[0.06]">
            <SegmentedButton
              active={tab === "ORGANIZATION"}
              onClick={() => setTab("ORGANIZATION")}
              icon={<Building2 className="w-3.5 h-3.5" />}
              label="Empresas"
              count={orgUsers.length}
              accent="brand"
            />
            <SegmentedButton
              active={tab === "PERSON"}
              onClick={() => setTab("PERSON")}
              icon={<UserCheck className="w-3.5 h-3.5" />}
              label="Creadores"
              count={creatorUsers.length}
              accent="violet"
            />
          </div>

          <p className="text-[11px] text-white/40">
            <span className="text-white font-semibold tabular-nums">{visibleCount}</span>
            {" "}
            de {totalCount}
            {activeFilters > 0 && (
              <> · <span className="text-[#B8EB23]/80">{activeFilters} filtro{activeFilters !== 1 ? "s" : ""}</span></>
            )}
          </p>
        </div>

        {/* Filter row */}
        <div className="rounded-xl bg-[#0F0F0F] border border-white/[0.06] p-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  tab === "ORGANIZATION"
                    ? "Buscar empresa, slug, email o dueño…"
                    : "Buscar creador, email o categoría…"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-9 h-10 rounded-lg bg-[#080808] border border-white/[0.08] text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#B8EB23]/40 focus:bg-[#0A0A0A] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="relative sm:ml-auto">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-9 pl-8 pr-7 rounded-lg bg-[#080808] border border-white/[0.08] text-[11px] font-semibold text-white/70 focus:outline-none focus:border-[#B8EB23]/40 appearance-none cursor-pointer"
              >
                <option value="recent" className="bg-[#0F0F0F]">Más recientes</option>
                <option value="activity" className="bg-[#0F0F0F]">Actividad reciente</option>
                <option value="name" className="bg-[#0F0F0F]">Nombre A-Z</option>
              </select>
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_PILLS.map((p) => (
              <button
                key={p.value}
                onClick={() => setStatusFilter(p.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                  statusFilter === p.value
                    ? "bg-white/[0.06] border-white/[0.12] text-white"
                    : "bg-transparent border-white/[0.06] text-white/45 hover:text-white hover:border-white/[0.12]",
                )}
              >
                {p.dot && <span className={cn("w-1.5 h-1.5 rounded-full", p.dot)} />}
                {p.label}
              </button>
            ))}

            {activeFilters > 0 && (
              <button
                onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
                className="ml-auto text-[11px] text-white/40 hover:text-white inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tables */}
        {tab === "ORGANIZATION"
          ? <OrgUsersTable rows={filteredOrgs} />
          : <CreatorUsersTable rows={filteredCreators} />}
      </section>
    </div>
  );
}

function SegmentedButton({
  active, onClick, icon, label, count, accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  accent: "brand" | "violet";
}) {
  const ACCENT = {
    brand:  { active: "bg-[#B8EB23]/15 text-[#B8EB23] ring-[#B8EB23]/25" },
    violet: { active: "bg-violet-400/15 text-violet-300 ring-violet-400/25" },
  } as const;

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ring-1",
        active
          ? `${ACCENT[accent].active}`
          : "bg-transparent ring-transparent text-white/45 hover:text-white hover:bg-white/[0.04]",
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          "px-1.5 py-0.5 rounded-md text-[10px] tabular-nums",
          active ? "bg-black/30" : "bg-white/[0.06] text-white/60",
        )}
      >
        {count}
      </span>
    </button>
  );
}
