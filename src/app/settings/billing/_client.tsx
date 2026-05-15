"use client";

import { motion } from "framer-motion";
import { CreditCard, Clock, Layers, MonitorPlay, Users, HardDrive, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  status: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  usage: { campaigns: number; screens: number; members: number; mediaAssets: number; storageMB: number };
}

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  TRIALING:    { label: "Trial",         tone: "text-amber-300 bg-amber-400/[0.08] border-amber-400/20" },
  ACTIVE:      { label: "Activa",        tone: "text-[#B8EB23] bg-[#B8EB23]/[0.08] border-[#B8EB23]/20" },
  PAST_DUE:    { label: "Vencida",       tone: "text-red-300 bg-red-400/[0.08] border-red-400/20" },
  CANCELED:    { label: "Cancelada",     tone: "text-white/40 bg-white/[0.04] border-white/[0.08]" },
  INCOMPLETE:  { label: "Incompleta",    tone: "text-amber-300 bg-amber-400/[0.08] border-amber-400/20" },
};

function UsageRow({
  icon: Icon, label, value, suffix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
      <span className="flex items-center gap-2.5 text-sm text-white/70">
        <Icon className="w-4 h-4 text-white/40" />
        {label}
      </span>
      <span className="text-sm tabular-nums text-white font-semibold">
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix && <span className="text-white/40 font-normal text-xs ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

export function BillingClient({ status, currentPeriodEnd, trialEndsAt, usage }: Props) {
  const statusCfg = STATUS_LABEL[status] ?? STATUS_LABEL.ACTIVE;

  return (
    <div className="space-y-5">
      {/* Status */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#B8EB23]/10 border border-[#B8EB23]/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-[#B8EB23]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Suscripción de la organización</p>
                <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {status === "TRIALING" && trialEndsAt ? (
                    <>Trial activo — termina el {new Date(trialEndsAt).toLocaleDateString("es-CO")}</>
                  ) : (
                    <>Próxima renovación: {new Date(currentPeriodEnd).toLocaleDateString("es-CO")}</>
                  )}
                </p>
              </div>
            </div>
            <span className={cn(
              "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
              statusCfg.tone,
            )}>
              {statusCfg.label}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader title="Uso de la organización" subtitle="Recursos en uso por tu equipo" icon={<Layers className="w-4 h-4" />} />
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <UsageRow icon={Layers}      label="Campañas"        value={usage.campaigns} />
            <UsageRow icon={MonitorPlay} label="Pantallas"        value={usage.screens} />
            <UsageRow icon={Users}       label="Miembros"         value={usage.members} />
            <UsageRow icon={HardDrive}   label="Archivos media"   value={usage.mediaAssets} />
            <UsageRow icon={HardDrive}   label="Almacenamiento"   value={usage.storageMB} suffix="MB" />
          </motion.div>
        </CardContent>
      </Card>

      {/* Invoices placeholder */}
      <Card>
        <CardHeader title="Historial de facturas" subtitle="Disponible cuando integremos pagos" icon={<FileText className="w-4 h-4" />} />
        <CardContent className="py-10 text-center">
          <p className="text-xs text-white/30">Aún no hay facturas. La facturación llegará pronto.</p>
        </CardContent>
      </Card>
    </div>
  );
}
