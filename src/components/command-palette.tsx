"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Megaphone, MonitorPlay, BarChart3,
  ClipboardCheck, Settings, Building2, Plus, Search, Zap, Layers,
  ArrowRight, Clock, X, CornerDownLeft, Command as CmdIcon,
} from "lucide-react";
import { useAppStore } from "@/store";
import { useSearchHistory } from "@/store/search-history";
import { fuzzyMatch, highlightSegments } from "@/lib/fuzzy";
import { duration, easing } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SearchResult = {
  campaigns: Array<{ id: string; name: string; status: string }>;
  clients: Array<{ id: string; name: string; industry?: string | null }>;
  screens: Array<{ id: string; name: string; city: string; status: string }>;
  ads: Array<{ id: string; title: string; status: string }>;
};

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  shortcut?: string[];
  href?: string;
  matches?: number[];
};

const NAV_DEFS: Array<{ id: string; label: string; icon: React.ReactNode; category: string; href: string; shortcut?: string[]; description?: string }> = [
  { id: "nav-dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, category: "Navegar a", href: "/dashboard", shortcut: ["G", "D"] },
  { id: "nav-campaigns", label: "Campañas", icon: <Layers className="w-4 h-4" />, category: "Navegar a", href: "/campaigns", shortcut: ["G", "C"] },
  { id: "nav-calendar", label: "Calendario", icon: <Layers className="w-4 h-4" />, category: "Navegar a", href: "/campaigns/calendar", description: "Programación de campañas" },
  { id: "nav-ads", label: "Anuncios", icon: <Megaphone className="w-4 h-4" />, category: "Navegar a", href: "/ads", shortcut: ["G", "A"] },
  { id: "nav-media", label: "Media", icon: <Megaphone className="w-4 h-4" />, category: "Navegar a", href: "/media", description: "Biblioteca de archivos" },
  { id: "nav-screens", label: "Pantallas DOOH", icon: <MonitorPlay className="w-4 h-4" />, category: "Navegar a", href: "/screens", shortcut: ["G", "S"] },
  { id: "nav-analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" />, category: "Navegar a", href: "/analytics", shortcut: ["G", "L"] },
  { id: "nav-approvals", label: "Aprobaciones", icon: <ClipboardCheck className="w-4 h-4" />, category: "Navegar a", href: "/approvals", shortcut: ["G", "P"] },
  { id: "nav-clients", label: "Clientes", icon: <Building2 className="w-4 h-4" />, category: "Navegar a", href: "/clients", shortcut: ["G", "K"] },
  { id: "nav-billing", label: "Facturación", icon: <Settings className="w-4 h-4" />, category: "Navegar a", href: "/settings/billing", description: "Plan + uso" },
  { id: "nav-activity", label: "Actividad", icon: <Settings className="w-4 h-4" />, category: "Navegar a", href: "/settings/activity", description: "Audit logs" },
  { id: "nav-settings", label: "Configuración", icon: <Settings className="w-4 h-4" />, category: "Navegar a", href: "/settings", shortcut: ["G", ","] },
  { id: "create-campaign", label: "Nueva campaña", icon: <Plus className="w-4 h-4" />, category: "Crear", href: "/campaigns/new", description: "Crear nueva campaña publicitaria", shortcut: ["C", "C"] },
  { id: "create-ad", label: "Nuevo anuncio", icon: <Plus className="w-4 h-4" />, category: "Crear", href: "/ads/new", description: "Subir creativo y enviar a revisión", shortcut: ["C", "A"] },
];

function HighlightedText({ text, matches }: { text: string; matches?: number[] }) {
  if (!matches || matches.length === 0) return <>{text}</>;
  const segments = highlightSegments(text, matches);
  return (
    <>
      {segments.map((seg, i) =>
        seg.match ? (
          <span key={i} className="text-[#B8EB23] font-semibold">{seg.text}</span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-medium text-white/40 bg-white/[0.05] rounded border border-white/[0.08]">
      {children}
    </kbd>
  );
}

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useAppStore();
  const { recent, add: addToHistory, remove: removeFromHistory, clear: clearHistory } = useSearchHistory();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setCommandOpen(false);
    setQuery("");
    setSearchResults(null);
    setActiveIdx(0);
  }, [setCommandOpen]);

  const go = useCallback((href: string, queryToSave?: string) => {
    if (queryToSave) addToHistory(queryToSave);
    router.push(href);
    close();
  }, [router, close, addToHistory]);

  // Build items: fuzzy-match nav + DB search results + recent searches when empty
  const items = useMemo<CommandItem[]>(() => {
    const q = query.trim();
    const result: CommandItem[] = [];

    // DB search results take precedence
    if (q && searchResults) {
      searchResults.campaigns.forEach((c) => result.push({
        id: `c-${c.id}`, label: c.name, description: `Campaña · ${c.status}`,
        icon: <Layers className="w-4 h-4" />, category: "Campañas", href: `/campaigns/${c.id}`,
      }));
      searchResults.clients.forEach((cl) => result.push({
        id: `cl-${cl.id}`, label: cl.name, description: cl.industry ?? "Cliente",
        icon: <Building2 className="w-4 h-4" />, category: "Clientes", href: "/clients",
      }));
      searchResults.screens.forEach((s) => result.push({
        id: `s-${s.id}`, label: s.name, description: `${s.city} · ${s.status}`,
        icon: <MonitorPlay className="w-4 h-4" />, category: "Pantallas", href: "/screens",
      }));
      searchResults.ads.forEach((a) => result.push({
        id: `a-${a.id}`, label: a.title, description: `Anuncio · ${a.status}`,
        icon: <Megaphone className="w-4 h-4" />, category: "Anuncios", href: "/ads",
      }));
    }

    // Fuzzy-filtered nav items
    const navItems: Array<CommandItem & { __score: number }> = [];
    for (const def of NAV_DEFS) {
      if (!q) {
        navItems.push({ ...def, __score: 0 });
        continue;
      }
      const labelMatch = fuzzyMatch(q, def.label);
      const descMatch = def.description ? fuzzyMatch(q, def.description) : null;
      const best = labelMatch && descMatch ? (labelMatch.score >= descMatch.score ? labelMatch : descMatch) : labelMatch ?? descMatch;
      if (best) {
        navItems.push({
          ...def,
          matches: best === labelMatch ? labelMatch.matches : undefined,
          __score: best.score,
        });
      }
    }
    navItems.sort((a, b) => b.__score - a.__score);
    result.push(...navItems);

    return result;
  }, [query, searchResults]);

  // Reset active idx when items change (derived from external input — debounced)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIdx(0);
    listRef.current?.scrollTo({ top: 0 });
  }, [query, items.length]);

  // Debounced DB search — setState here is gated by debounce + length check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults(null);
       
      setSearching(false);
      return;
    }
     
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // CMD+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (commandOpen) close(); else setCommandOpen(true);
      }
      if (e.key === "Escape" && commandOpen) close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandOpen, close, setCommandOpen]);

  // Focus input
  useEffect(() => {
    if (commandOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [commandOpen]);

  // Scroll active into view
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-cmd-idx="${activeIdx}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIdx];
      if (item?.href) go(item.href, query.trim() || undefined);
    }
  };

  const showRecent = !query.trim() && recent.length > 0;
  const showEmptyState = !!query.trim() && items.length === 0 && !searching;

  // Group items by category preserving order
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of items) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  let globalIdx = 0;

  return (
    <AnimatePresence>
      {commandOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast, ease: easing.out }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200]"
            onClick={close}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-label="Paleta de comandos"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: duration.fast, ease: easing.spring }}
            className="fixed top-[14%] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[600px] z-[201]"
          >
            <div className="bg-[#0F0F0F]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]">
                <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar páginas, campañas, pantallas..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                  autoComplete="off"
                  spellCheck="false"
                  aria-label="Buscar"
                />
                {searching && (
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-[#B8EB23] rounded-full animate-spin flex-shrink-0" />
                )}
                {query && !searching && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-white/30 hover:text-white transition-colors flex-shrink-0"
                    aria-label="Limpiar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <Kbd>ESC</Kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[420px] overflow-y-auto py-2">
                {/* Recent searches (empty query state) */}
                {showRecent && (
                  <div>
                    <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Búsquedas recientes
                      </p>
                      <button
                        onClick={clearHistory}
                        className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        Limpiar
                      </button>
                    </div>
                    {recent.map((r) => (
                      <button
                        key={r}
                        onClick={() => setQuery(r)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-white/[0.04] transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                          <Clock className="w-3.5 h-3.5 text-white/30" />
                        </div>
                        <span className="flex-1 text-sm text-white/60 truncate group-hover:text-white">{r}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromHistory(r); }}
                          className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-white/60 transition-all flex-shrink-0"
                          aria-label={`Eliminar "${r}"`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </button>
                    ))}
                    <div className="px-4 pt-2 pb-1">
                      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                        Sugerencias
                      </p>
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {showEmptyState && (
                  <div className="py-10 text-center">
                    <Search className="w-7 h-7 text-white/15 mx-auto mb-3" />
                    <p className="text-sm text-white/40">Sin resultados para</p>
                    <p className="text-sm font-medium text-white mt-1">&ldquo;{query}&rdquo;</p>
                    <p className="text-[11px] text-white/25 mt-3">
                      Intenta con otros términos o navega usando ↑↓
                    </p>
                  </div>
                )}

                {/* Grouped results */}
                {grouped.map(([category, catItems]) => (
                  <div key={category}>
                    <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                      {category}
                    </p>
                    {catItems.map((item) => {
                      const idx = globalIdx++;
                      const isActive = idx === activeIdx;
                      return (
                        <button
                          key={item.id}
                          data-cmd-idx={idx}
                          onClick={() => item.href && go(item.href, query.trim() || undefined)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all",
                            isActive ? "bg-[#B8EB23]/[0.08]" : "hover:bg-white/[0.04]"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                            isActive ? "bg-[#B8EB23]/15 text-[#B8EB23]" : "bg-white/[0.06] text-white/40"
                          )}>
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium truncate", isActive ? "text-white" : "text-white")}>
                              <HighlightedText text={item.label} matches={item.matches} />
                            </p>
                            {item.description && (
                              <p className="text-[11px] text-white/35 truncate mt-0.5">{item.description}</p>
                            )}
                          </div>
                          {item.shortcut && (
                            <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                              {item.shortcut.map((k, i) => <Kbd key={i}>{k}</Kbd>)}
                            </div>
                          )}
                          {isActive && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-[#B8EB23]/60 flex-shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-3 text-[10px] text-white/30">
                  <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navegar</span>
                  <span className="hidden sm:flex items-center gap-1"><Kbd>↵</Kbd> abrir</span>
                  <span className="hidden md:flex items-center gap-1"><Kbd>ESC</Kbd> cerrar</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/25">
                  <CmdIcon className="w-2.5 h-2.5" />
                  <span>K en cualquier momento</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
