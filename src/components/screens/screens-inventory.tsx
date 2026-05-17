"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, LayoutGrid, List, Plus, ArrowUpDown,
  Layers, Sun, Moon, Building2,
} from "lucide-react";
import { ScreenCard, ScreenRow, type CardScreen } from "./screen-card";
import { Button } from "@/components/ui/button";
import { NoSearchResults } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { ScreenStatus } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Inventory section — sits below the fleet map.
 *
 *   Filter axis 1: status pills        (all / online / offline / mant / reserved)
 *   Filter axis 2: city dropdown       (auto-derived from data)
 *   Filter axis 3: indoor / outdoor    (LED_INDOOR + LCD vs LED_OUTDOOR + ...)
 *   Filter axis 4: search              (name / city / code)
 *   Filter axis 5: sort                (name / traffic / city / status)
 *   Layout: grid (premium cards) | list (compact rows)
 *
 * Pure presentational — selection state lives in the parent so the map
 * and the inventory stay synchronized.
 * ────────────────────────────────────────────────────────────────────── */

const INDOOR_TYPES = new Set(["LED_INDOOR", "LCD", "INTERACTIVE"]);

const STATUS_PILLS: Array<{ value: ScreenStatus | "ALL"; label: string; dot?: string }> = [
  { value: "ALL", label: "Todas" },
  { value: "ONLINE", label: "En línea", dot: "bg-[#B8EB23]" },
  { value: "OFFLINE", label: "Sin conexión", dot: "bg-red-400" },
  { value: "MAINTENANCE", label: "Mantenimiento", dot: "bg-orange-400" },
  { value: "RESERVED", label: "Reservadas", dot: "bg-blue-400" },
];

type SortKey = "name" | "traffic" | "city" | "status";

interface Props {
  screens: CardScreen[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  canCreate?: boolean;
  onCreate?: () => void;
}

export function ScreensInventory({ screens, selectedId, onSelect, canCreate, onCreate }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScreenStatus | "ALL">("ALL");
  const [cityFilter, setCityFilter] = useState<string>("ALL");
  const [envFilter, setEnvFilter] = useState<"ALL" | "INDOOR" | "OUTDOOR">("ALL");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortKey>("status");

  const cities = useMemo(() => {
    const set = new Set(screens.map((s) => s.city));
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [screens]);

  const filtered = useMemo(() => {
    let list = [...screens];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "ALL") list = list.filter((s) => s.status === statusFilter);
    if (cityFilter !== "ALL") list = list.filter((s) => s.city === cityFilter);
    if (envFilter !== "ALL") {
      list = list.filter((s) =>
        envFilter === "INDOOR" ? INDOOR_TYPES.has(s.type) : !INDOOR_TYPES.has(s.type),
      );
    }
    list.sort((a, b) => {
      switch (sort) {
        case "name": return a.name.localeCompare(b.name);
        case "city": return a.city.localeCompare(b.city);
        case "traffic": return b.dailyTraffic - a.dailyTraffic;
        case "status":
        default: {
          const order: Record<string, number> = { ONLINE: 0, MAINTENANCE: 1, RESERVED: 2, OFFLINE: 3 };
          return (order[a.status] ?? 9) - (order[b.status] ?? 9);
        }
      }
    });
    return list;
  }, [screens, search, statusFilter, cityFilter, envFilter, sort]);

  const activeFilters = (statusFilter !== "ALL" ? 1 : 0) + (cityFilter !== "ALL" ? 1 : 0) + (envFilter !== "ALL" ? 1 : 0) + (search ? 1 : 0);

  return (
    <section className="space-y-4">
      {/* ───────── header ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/60">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Inventario de pantallas</h2>
            <p className="text-[11px] text-white/40 mt-0.5">
              {filtered.length} {filtered.length === 1 ? "pantalla" : "pantallas"}
              {activeFilters > 0 && (
                <>
                  {" "}· <span className="text-[#B8EB23]/80">{activeFilters} filtro{activeFilters !== 1 ? "s" : ""} activo{activeFilters !== 1 ? "s" : ""}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {canCreate && (
          <Button variant="brand" size="sm" icon={<Plus className="w-4 h-4" />} onClick={onCreate}>
            Nueva pantalla
          </Button>
        )}
      </div>

      {/* ───────── filter bar ───────── */}
      <div className="rounded-xl bg-[#0F0F0F] border border-white/[0.06] p-3 space-y-3">
        {/* Row 1: search + view + sort */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar pantalla, ciudad o código…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 pr-9 h-10 rounded-lg bg-[#080808] border border-white/[0.08] text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#B8EB23]/40 focus:bg-[#0A0A0A] transition-all"
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

          <div className="flex items-center gap-1.5 sm:ml-auto">
            {/* sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-9 pl-8 pr-7 rounded-lg bg-[#080808] border border-white/[0.08] text-[11px] font-semibold text-white/70 focus:outline-none focus:border-[#B8EB23]/40 appearance-none cursor-pointer"
              >
                <option value="status" className="bg-[#0F0F0F]">Estado</option>
                <option value="name" className="bg-[#0F0F0F]">Nombre A-Z</option>
                <option value="city" className="bg-[#0F0F0F]">Ciudad A-Z</option>
                <option value="traffic" className="bg-[#0F0F0F]">Tráfico ↓</option>
              </select>
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
            </div>

            {/* view toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[#080808] border border-white/[0.08]">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  view === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white",
                )}
                aria-label="Vista grilla"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  view === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white",
                )}
                aria-label="Vista lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: status pills */}
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
        </div>

        {/* Row 3: env + city */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[#080808] border border-white/[0.08]">
            {([
              { v: "ALL", label: "Todo", icon: null },
              { v: "OUTDOOR", label: "Exterior", icon: <Sun className="w-3 h-3" /> },
              { v: "INDOOR", label: "Interior", icon: <Moon className="w-3 h-3" /> },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                onClick={() => setEnvFilter(opt.v)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all",
                  envFilter === opt.v
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white",
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-8 pl-7 pr-7 rounded-lg bg-[#080808] border border-white/[0.08] text-[11px] font-semibold text-white/70 focus:outline-none focus:border-[#B8EB23]/40 appearance-none cursor-pointer"
            >
              {cities.map((c) => (
                <option key={c} value={c} className="bg-[#0F0F0F]">
                  {c === "ALL" ? "Todas las ciudades" : c}
                </option>
              ))}
            </select>
          </div>

          {activeFilters > 0 && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setCityFilter("ALL");
                setEnvFilter("ALL");
              }}
              className="text-[11px] text-white/40 hover:text-white inline-flex items-center gap-1 ml-auto"
            >
              <X className="w-3 h-3" /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ───────── results ───────── */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-[#0F0F0F] border border-white/[0.05]"
          >
            <NoSearchResults query={search || statusFilter || cityFilter || envFilter} />
          </motion.div>
        ) : view === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          >
            {filtered.map((s, i) => (
              <ScreenCard
                key={s.id}
                screen={s}
                index={i}
                selected={selectedId === s.id}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-1.5"
          >
            <div className="grid grid-cols-12 items-center gap-3 px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white/25">
              <div className="col-span-4">Pantalla</div>
              <div className="col-span-2">Ciudad</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-1">Tamaño</div>
              <div className="col-span-1">Tráfico</div>
              <div className="col-span-2 text-right">Estado</div>
            </div>
            {filtered.map((s, i) => (
              <ScreenRow
                key={s.id}
                screen={s}
                index={i}
                selected={selectedId === s.id}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
