"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map as MapboxMap, Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import Supercluster from "supercluster";
import Link from "next/link";
import { ArrowUpRight, Wifi } from "lucide-react";
import { resolveScreenCoords } from "@/lib/colombia-geo";
import type { ScreenStatus } from "@/types";
import type { AssignedCampaignItem } from "@/components/screens/screen-detail-panel";

export interface DOOHScreen {
  id: string;
  name: string;
  code: string;
  city: string;
  status: ScreenStatus;
  type: string;
  dailyTraffic: number;
  resolutionWidth?: number | null;
  resolutionHeight?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  lastPingAt?: string | null;
  screenCampaigns?: AssignedCampaignItem[];
}

const STATUS_FILL: Record<ScreenStatus, string> = {
  ONLINE: "#B8EB23",
  OFFLINE: "#F87171",
  MAINTENANCE: "#FB923C",
  RESERVED: "#60A5FA",
};

const STATUS_LABEL: Record<ScreenStatus, string> = {
  ONLINE: "En línea",
  OFFLINE: "Sin conexión",
  MAINTENANCE: "Mantenimiento",
  RESERVED: "Reservada",
};

// Initial bounding box covering Colombia and surrounding area.
const COLOMBIA_BBOX: [number, number, number, number] = [-82, -5, -66, 13];

interface Props {
  screens: DOOHScreen[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  statusFilter?: ScreenStatus | "ALL";
}

type ScreenPointProps = { screenId: string };

// ─── Pin components ───────────────────────────────────────────────────────────

function ScreenPin({
  screen,
  isSelected,
}: {
  screen: DOOHScreen;
  isSelected: boolean;
}) {
  const fill = STATUS_FILL[screen.status];
  const isOnline = screen.status === "ONLINE";

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: 28, height: 28, cursor: "pointer" }}
      whileHover={{ scale: 1.2 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {isOnline && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 28, height: 28, backgroundColor: fill }}
          animate={{ scale: [0.5, 2.2], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      {isSelected && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 38,
            height: 38,
            background: `${fill}18`,
            border: `1px solid ${fill}55`,
          }}
        />
      )}
      <div
        className="absolute rounded-full"
        style={{
          width: 20,
          height: 20,
          backgroundColor: "rgba(0,0,0,0.82)",
          border: `1.5px solid ${fill}`,
          boxShadow: isOnline
            ? `0 0 10px ${fill}70, 0 0 20px ${fill}30`
            : `0 0 5px ${fill}40`,
        }}
      />
      <div
        className="relative z-10 rounded-full"
        style={{
          width: 9,
          height: 9,
          backgroundColor: fill,
          boxShadow: `0 0 8px ${fill}`,
        }}
      />
    </motion.div>
  );
}

function ClusterPin({ count, color }: { count: number; color: string }) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: 44, height: 44, cursor: "pointer" }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `${color}0E`,
          border: `1px solid ${color}40`,
          boxShadow: `0 0 14px ${color}25`,
        }}
      />
      {/* Inner ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 32,
          height: 32,
          background: `rgba(0,0,0,0.85)`,
          border: `1.5px solid ${color}65`,
        }}
      />
      <span
        className="relative z-10 font-bold tabular-nums leading-none"
        style={{ color, fontSize: count > 99 ? 9 : count > 9 ? 11 : 13 }}
      >
        {count}
      </span>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DOOHNetworkMap({
  screens,
  selectedId,
  onSelect,
  statusFilter = "ALL",
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewport, setViewport] = useState<{
    zoom: number;
    bounds: [number, number, number, number];
  }>({ zoom: 5, bounds: COLOMBIA_BBOX });

  const [popupId, setPopupId] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    screenId: string;
    x: number;
    y: number;
  } | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Screens with resolved coordinates, filtered by status
  const placedScreens = useMemo(() => {
    return screens
      .filter((s) => statusFilter === "ALL" || s.status === statusFilter)
      .flatMap((s) => {
        const c = resolveScreenCoords(s);
        if (!c) return [];
        return [{ screen: s, lat: c.lat, lng: c.lng }];
      });
  }, [screens, statusFilter]);

  // O(1) lookup by screen id
  const screenById = useMemo(
    () => new Map(placedScreens.map((p) => [p.screen.id, p])),
    [placedScreens],
  );

  // Supercluster instance — rebuilt when placed screens change
  const index = useMemo(() => {
    const sc = new Supercluster<ScreenPointProps>({ radius: 50, maxZoom: 14 });
    sc.load(
      placedScreens.map((p) => ({
        type: "Feature" as const,
        properties: { screenId: p.screen.id },
        geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
      })),
    );
    return sc;
  }, [placedScreens]);

  // Clusters + ungrouped points for the current viewport
  const clusters = useMemo(
    () => index.getClusters(viewport.bounds, viewport.zoom),
    [index, viewport],
  );

  const updateViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    if (!b) return;
    setViewport({
      zoom: Math.round(map.getZoom()),
      bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
    });
  }, []);

  const handleMarkerClick = useCallback(
    (e: { originalEvent: MouseEvent }, screenId: string) => {
      e.originalEvent.stopPropagation();
      setHoverInfo(null);
      setPopupId((prev) => (prev === screenId ? null : screenId));
      onSelect(screenId);
    },
    [onSelect],
  );

  const handleClusterClick = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      const zoom = Math.min(index.getClusterExpansionZoom(clusterId), 20);
      mapRef.current?.easeTo({ center: [lng, lat], zoom, duration: 500 });
    },
    [index],
  );

  const popupData = useMemo(
    () => (popupId ? (screenById.get(popupId) ?? null) : null),
    [popupId, screenById],
  );

  const popupActiveCampaigns = useMemo(
    () =>
      popupData?.screen.screenCampaigns?.filter(
        (sc) => sc.isActive && sc.campaign.status === "ACTIVE",
      ) ?? [],
    [popupData],
  );

  const hoveredScreen = useMemo(
    () => (hoverInfo ? (screenById.get(hoverInfo.screenId)?.screen ?? null) : null),
    [hoverInfo, screenById],
  );

  const hoveredActiveCampaign = useMemo(
    () =>
      hoveredScreen?.screenCampaigns?.find(
        (sc) => sc.isActive && sc.campaign.status === "ACTIVE",
      ) ?? null,
    [hoveredScreen],
  );

  const onlineCount = useMemo(
    () => screens.filter((s) => s.status === "ONLINE").length,
    [screens],
  );

  if (!token) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0A0A0A]">
        <p className="text-xs text-white/30">Mapbox token no configurado</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <MapboxMap
        ref={mapRef}
        mapboxAccessToken={token}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        initialViewState={{ longitude: -74.3, latitude: 4.5, zoom: 5.5 }}
        style={{ width: "100%", height: "100%" }}
        reuseMaps
        attributionControl={false}
        onLoad={updateViewport}
        onMoveEnd={updateViewport}
        onClick={() => {
          setPopupId(null);
          setHoverInfo(null);
        }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {clusters.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates as [number, number];

          if ((feature.properties as { cluster?: boolean }).cluster) {
            // ── Cluster pin ──────────────────────────────────────────────
            const { cluster_id, point_count } = feature.properties as {
              cluster_id: number;
              point_count: number;
            };

            const leaves = index.getLeaves(cluster_id, Infinity);
            const statuses = leaves
              .map((l) => screenById.get((l.properties as ScreenPointProps).screenId)?.screen.status)
              .filter(Boolean) as ScreenStatus[];

            let clusterColor = STATUS_FILL.RESERVED;
            if (statuses.every((s) => s === "ONLINE")) clusterColor = STATUS_FILL.ONLINE;
            else if (statuses.some((s) => s === "OFFLINE")) clusterColor = STATUS_FILL.OFFLINE;
            else if (statuses.some((s) => s === "MAINTENANCE")) clusterColor = STATUS_FILL.MAINTENANCE;

            return (
              <Marker
                key={`cluster-${cluster_id}`}
                longitude={lng}
                latitude={lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleClusterClick(cluster_id, lng, lat);
                }}
              >
                <ClusterPin count={point_count} color={clusterColor} />
              </Marker>
            );
          }

          // ── Individual pin ────────────────────────────────────────────
          const { screenId } = feature.properties as ScreenPointProps;
          const data = screenById.get(screenId);
          if (!data) return null;
          const { screen } = data;

          return (
            <Marker
              key={screen.id}
              longitude={lng}
              latitude={lat}
              anchor="center"
              onClick={(e) => handleMarkerClick(e, screen.id)}
            >
              <div
                onMouseEnter={(e: React.MouseEvent) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setHoverInfo({
                    screenId: screen.id,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseMove={(e: React.MouseEvent) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setHoverInfo((prev) =>
                    prev?.screenId === screen.id
                      ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top }
                      : prev,
                  );
                }}
                onMouseLeave={() => setHoverInfo(null)}
              >
                <ScreenPin screen={screen} isSelected={selectedId === screen.id} />
              </div>
            </Marker>
          );
        })}

        {/* Click popup */}
        {popupData && (
          <Popup
            longitude={popupData.lng}
            latitude={popupData.lat}
            anchor="bottom"
            offset={[0, -22] as [number, number]}
            closeButton={false}
            closeOnClick={false}
            className="dooh-map-popup"
          >
            <div className="rounded-xl bg-[#0D0D0D]/96 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/70 p-3.5 min-w-[210px]">
              <div className="flex items-center justify-between mb-2.5">
                <span
                  className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: STATUS_FILL[popupData.screen.status] }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: STATUS_FILL[popupData.screen.status] }}
                  />
                  {STATUS_LABEL[popupData.screen.status]}
                </span>
                <button
                  onClick={() => setPopupId(null)}
                  className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white hover:bg-white/10 transition-colors text-sm leading-none"
                >
                  ×
                </button>
              </div>

              <p className="text-sm font-bold text-white leading-tight">{popupData.screen.name}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{popupData.screen.city}</p>

              {popupData.screen.resolutionWidth && (
                <p className="text-[10px] text-white/25 mt-1 font-mono">
                  {popupData.screen.resolutionWidth}×{popupData.screen.resolutionHeight ?? "?"}px
                </p>
              )}

              {popupActiveCampaigns.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-white/[0.06]">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">
                    Campaña activa
                  </p>
                  <p className="text-[11px] font-medium text-[#B8EB23] truncate max-w-[190px]">
                    {popupActiveCampaigns[0]!.campaign.name}
                  </p>
                </div>
              )}

              <Link
                href={`/screens/${popupData.screen.id}`}
                onClick={() => setPopupId(null)}
                className="mt-3 flex items-center justify-between w-full px-2.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.12] transition-all text-[11px] font-medium text-white/60 hover:text-white"
              >
                Ver detalle
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Popup>
        )}
      </MapboxMap>

      {/* Hover tooltip — rendered outside <Map> to avoid z-index issues */}
      <AnimatePresence>
        {hoverInfo && hoveredScreen && !popupId && (
          <motion.div
            key={hoverInfo.screenId}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute pointer-events-none z-30"
            style={{
              left: Math.max(
                8,
                Math.min(
                  hoverInfo.x - 108,
                  (containerRef.current?.offsetWidth ?? 600) - 232,
                ),
              ),
              top: Math.max(8, hoverInfo.y - 148),
            }}
          >
            <div className="rounded-xl bg-black/80 backdrop-blur-md border border-[#B8EB23]/20 shadow-2xl shadow-black/60 p-3 min-w-[216px]">
              {/* Status */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: STATUS_FILL[hoveredScreen.status] }}
                />
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: STATUS_FILL[hoveredScreen.status] }}
                >
                  {STATUS_LABEL[hoveredScreen.status]}
                </span>
              </div>
              {/* Name + city */}
              <p className="text-xs font-bold text-white leading-tight truncate max-w-[200px]">
                {hoveredScreen.name}
              </p>
              <p className="text-[10px] text-white/45 mt-0.5">
                {hoveredScreen.city}
              </p>
              {/* Resolution */}
              {hoveredScreen.resolutionWidth && (
                <p className="text-[10px] text-white/25 mt-1 font-mono">
                  {hoveredScreen.resolutionWidth}×{hoveredScreen.resolutionHeight ?? "?"}px
                </p>
              )}
              {/* Active campaign */}
              {hoveredActiveCampaign && (
                <div className="mt-1.5 pt-1.5 border-t border-white/[0.06]">
                  <p className="text-[10px] text-[#B8EB23]/80 truncate max-w-[200px]">
                    {hoveredActiveCampaign.campaign.name}
                  </p>
                </div>
              )}
              <p className="text-[9px] text-white/25 mt-2 italic">Click para ver detalles</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#0A0A0A]/90 backdrop-blur-sm border border-white/[0.08] pointer-events-none z-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/35 px-1 mb-0.5">
          Estado
        </p>
        {(["ONLINE", "OFFLINE", "MAINTENANCE", "RESERVED"] as const).map((s) => (
          <div key={s} className="flex items-center gap-2 px-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: STATUS_FILL[s] }}
            />
            <span className="text-[10px] text-white/60 font-medium">{STATUS_LABEL[s]}</span>
          </div>
        ))}
      </div>

      {/* Live status pill */}
      <div className="absolute bottom-12 left-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0A0A0A]/90 backdrop-blur-sm border border-white/[0.08] pointer-events-none z-10">
        <Wifi className="w-3.5 h-3.5 text-[#B8EB23]" />
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-white/40">Mapeado</span>
          <span className="text-[#B8EB23] font-semibold tabular-nums">
            {placedScreens.length} pin{placedScreens.length !== 1 ? "s" : ""}
          </span>
          {onlineCount > 0 && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-[#B8EB23]/70">{onlineCount} online</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
