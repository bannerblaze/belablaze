"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Map, Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
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

interface Props {
  screens: DOOHScreen[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  statusFilter?: ScreenStatus | "ALL";
}

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

export function DOOHNetworkMap({
  screens,
  selectedId,
  onSelect,
  statusFilter = "ALL",
}: Props) {
  const [popupId, setPopupId] = useState<string | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const placedScreens = useMemo(() => {
    return screens
      .filter((s) => statusFilter === "ALL" || s.status === statusFilter)
      .flatMap((s) => {
        const c = resolveScreenCoords(s);
        if (!c) return [];
        return [{ screen: s, lat: c.lat, lng: c.lng }];
      });
  }, [screens, statusFilter]);

  const popupData = useMemo(
    () => (popupId ? (placedScreens.find((p) => p.screen.id === popupId) ?? null) : null),
    [popupId, placedScreens],
  );

  const handleMarkerClick = useCallback(
    (e: { originalEvent: MouseEvent }, screenId: string) => {
      e.originalEvent.stopPropagation();
      setPopupId((prev) => (prev === screenId ? null : screenId));
      onSelect(screenId);
    },
    [onSelect],
  );

  const activeCampaigns = useMemo(
    () =>
      popupData?.screen.screenCampaigns?.filter(
        (sc) => sc.isActive && sc.campaign.status === "ACTIVE",
      ) ?? [],
    [popupData],
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
    <div className="relative w-full h-full">
      <Map
        mapboxAccessToken={token}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        initialViewState={{ longitude: -74.3, latitude: 4.5, zoom: 5.5 }}
        style={{ width: "100%", height: "100%" }}
        reuseMaps
        attributionControl={false}
        onClick={() => setPopupId(null)}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {placedScreens.map(({ screen, lat, lng }) => (
          <Marker
            key={screen.id}
            longitude={lng}
            latitude={lat}
            anchor="center"
            onClick={(e) => handleMarkerClick(e, screen.id)}
          >
            <ScreenPin screen={screen} isSelected={selectedId === screen.id} />
          </Marker>
        ))}

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

              {activeCampaigns.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-white/[0.06]">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">
                    Campaña activa
                  </p>
                  <p className="text-[11px] font-medium text-[#B8EB23] truncate max-w-[190px]">
                    {activeCampaigns[0]!.campaign.name}
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
      </Map>

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
