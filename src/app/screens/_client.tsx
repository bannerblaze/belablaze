"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ScreensOverview, deriveFleetMetrics } from "@/components/screens/screens-overview";
import { ScreensFleetMap } from "@/components/screens/screens-fleet-map";
import { ScreensInventory } from "@/components/screens/screens-inventory";
import { ScreenDetailPanel } from "@/components/screens/screen-detail-panel";
import { ScreenFleetEmpty } from "@/components/screens/screen-fleet-empty";
import { ScreenFormModal } from "@/components/forms/screen-form";
import type { ScreenStatus } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Screens module — fleet operations console.
 *
 * Layout (top → bottom):
 *   1. Overview metric strip
 *   2. Interactive Colombia map (fleet centerpiece)
 *   3. Inventory section (filters + grid/list)
 *   4. Slide-out detail panel (driven by selectedId)
 *   5. Create modal (driven by canCreate + showCreate)
 *
 * State stays here so map + inventory + panel always agree on the
 * selected pin. Mutations go through server actions and trigger a
 * router refresh via revalidatePath in the action — no client cache
 * to keep in sync.
 *
 * Future-ready: swapping `screens` for a Suspense-streamed source or
 * a websocket subscription is a one-line change here — every child is
 * pure and re-renders deterministically from the prop.
 * ────────────────────────────────────────────────────────────────────── */

import type { AssignedCampaignItem } from "@/components/screens/screen-detail-panel";

interface Screen {
  id: string;
  name: string;
  code: string;
  type: string;
  status: ScreenStatus;
  city: string;
  address: string;
  width: number;
  height: number;
  resolutionWidth: number;
  resolutionHeight: number;
  dailyTraffic: number;
  pricePerSecond: number;
  orientation: string;
  playerKey?: string;
  latitude?: number | null;
  longitude?: number | null;
  lastPingAt?: string | null;
  createdAt?: string | null;
  screenCampaigns?: AssignedCampaignItem[];
}

interface Props {
  screens: Screen[];
  canCreate?: boolean;
  canManage?: boolean;
}

export function ScreensClient({ screens, canCreate = false, canManage = false }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());

  // Track when screens data was last received from the server.
  useEffect(() => {
    setLastRefreshed(Date.now());
  }, [screens]);

  // Silently refresh server-component data every 30 seconds.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);

  const metrics = useMemo(() => deriveFleetMetrics(screens), [screens]);
  const selectedScreen = useMemo(
    () => screens.find((s) => s.id === selectedId) ?? null,
    [selectedId, screens],
  );

  // Empty state — the whole module collapses into the premium intro card.
  if (screens.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 max-w-[1500px]">
        <div className="mb-5">
          <h1 className="text-lg font-bold text-white">Pantallas DOOH</h1>
          <p className="text-xs text-white/40 mt-0.5">
            Centro de operaciones de tu red de pantallas digitales
          </p>
        </div>
        <ScreenFleetEmpty
          canCreate={canCreate}
          onCreate={() => setShowCreate(true)}
        />
        <ScreenFormModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-6 max-w-[1500px]">
      {/* ───────── page header ───────── */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight">
            Pantallas DOOH
          </h1>
          <p className="text-xs text-white/45 mt-1 max-w-xl">
            Centro de operaciones de tu red de pantallas digitales — telemetría,
            inventario y monitoreo en tiempo real.
          </p>
        </div>
      </motion.div>

      {/* ───────── 1. overview ───────── */}
      <ScreensOverview metrics={metrics} />

      {/* ───────── 2. fleet map ───────── */}
      <ScreensFleetMap
        screens={screens}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
        lastRefreshed={lastRefreshed}
      />

      {/* ───────── 3. inventory ───────── */}
      <ScreensInventory
        screens={screens}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
        canCreate={canCreate}
        onCreate={() => setShowCreate(true)}
      />

      {/* ───────── 4. detail panel ───────── */}
      <ScreenDetailPanel
        screen={selectedScreen}
        open={!!selectedScreen}
        onClose={() => setSelectedId(null)}
        canManage={canManage}
      />

      {/* ───────── 5. create modal ───────── */}
      <ScreenFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => setShowCreate(false)}
      />
    </div>
  );
}
