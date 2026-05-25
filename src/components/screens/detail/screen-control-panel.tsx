"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Copy, ExternalLink, RefreshCw, Zap,
  WrenchIcon, Check, Power, Pencil,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { pingScreen, updateScreenStatus } from "@/actions/screens";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { ScreenDetailData } from "@/services/screen-details.service";
import { EditScreenModal } from "@/app/screens/[screenId]/_client";

/* ──────────────────────────────────────────────────────────────────────
 * ScreenControlPanel — admin action buttons for the detail page.
 *
 * All mutations go through existing server actions. Client component
 * because it needs clipboard API, window.open(), and router.refresh().
 * ────────────────────────────────────────────────────────────────────── */

interface Props { data: ScreenDetailData }

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
  loading?: boolean;
  variant?: "default" | "brand" | "danger" | "warn";
  disabled?: boolean;
}

function ActionButton({
  icon: Icon, label, description, onClick, loading, variant = "default", disabled,
}: ActionButtonProps) {
  const colors = {
    default: "border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.04] text-white/70",
    brand:   "border-[#B8EB23]/20 hover:border-[#B8EB23]/35 hover:bg-[#B8EB23]/[0.06] text-[#B8EB23]/80",
    danger:  "border-red-400/20 hover:border-red-400/35 hover:bg-red-400/[0.06] text-red-400/80",
    warn:    "border-yellow-400/20 hover:border-yellow-400/35 hover:bg-yellow-400/[0.06] text-yellow-400/80",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex items-start gap-2.5 p-3 rounded-xl border transition-all text-left w-full",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        colors[variant],
      )}
    >
      <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
        {loading
          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          : <Icon className="w-3.5 h-3.5" />
        }
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold leading-none">{label}</p>
        <p className="text-[10px] text-white/30 mt-1 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

export function ScreenControlPanel({ data }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isPinging, startPing] = useTransition();
  const [isMaintenance, startMaintenance] = useTransition();

  const playerUrl = typeof window !== "undefined"
    ? `${window.location.origin}/player/${data.playerKey}`
    : `/player/${data.playerKey}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/player/${data.playerKey}`,
      );
      setCopied(true);
      toast.success("URL del player copiada");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleOpenPlayer = () => {
    window.open(`/player/${data.playerKey}`, "_blank");
  };

  const handlePing = () => {
    startPing(async () => {
      try {
        await pingScreen(data.id);
        toast.success("Ping enviado exitosamente");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al enviar ping");
      }
    });
  };

  const handleRefresh = () => {
    router.refresh();
    toast.info("Actualizando datos…");
  };

  const handleMaintenance = () => {
    const nextStatus = data.status === "MAINTENANCE" ? "OFFLINE" : "MAINTENANCE";
    startMaintenance(async () => {
      try {
        await updateScreenStatus(data.id, nextStatus as "MAINTENANCE" | "OFFLINE" | "ONLINE");
        toast.success(
          nextStatus === "MAINTENANCE"
            ? "Pantalla en modo mantenimiento"
            : "Mantenimiento desactivado",
        );
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  };

  return (
    <>
      <EditScreenModal open={editOpen} onClose={() => setEditOpen(false)} data={data} />

      <Card className="h-full">
        <CardHeader
          title="Panel de control"
          subtitle="Acciones sobre el dispositivo"
          icon={<Power className="w-4 h-4" />}
        />
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
            <ActionButton
              icon={Pencil}
              label="Editar pantalla"
              description="Modificar configuración"
              onClick={() => setEditOpen(true)}
              variant="brand"
            />
            <ActionButton
              icon={copied ? Check : Copy}
              label="Copiar URL"
              description="URL del player DOOH"
              onClick={handleCopyUrl}
              variant="brand"
            />
            <ActionButton
              icon={ExternalLink}
              label="Abrir Player"
              description="Nueva pestaña fullscreen"
              onClick={handleOpenPlayer}
            />
            <ActionButton
              icon={Zap}
              label="Ping"
              description="Verificar conexión"
              onClick={handlePing}
              loading={isPinging}
            />
            <ActionButton
              icon={RefreshCw}
              label="Actualizar"
              description="Refrescar datos"
              onClick={handleRefresh}
            />
            <ActionButton
              icon={WrenchIcon}
              label={data.status === "MAINTENANCE" ? "Salir Mant." : "Mantenimiento"}
              description="Cambiar estado del dispositivo"
              onClick={handleMaintenance}
              loading={isMaintenance}
              variant={data.status === "MAINTENANCE" ? "warn" : "default"}
            />
          </div>

          {/* Player key display */}
          <div className="mt-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/25 mb-1">
              Player Key
            </p>
            <p className="text-[10px] font-mono text-white/45 break-all leading-relaxed">
              {data.playerKey}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
