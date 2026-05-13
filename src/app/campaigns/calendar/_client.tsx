"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarRange, Clock, Plus, AlertTriangle, Pause, Play, Trash2, X,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { createSchedule, deleteSchedule, updateScheduleStatus } from "@/actions/schedules";
import type { ScheduleStatus } from "@/types";

type Schedule = {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
  clientName: string | null;
  startDate: string;
  endDate: string;
  activeDays: number[];
  startHour: number;
  endHour: number;
  priority: number;
  status: ScheduleStatus;
  notes: string | null;
};

type Campaign = { id: string; name: string; status: string; clientName: string | null };

interface Props {
  canManage: boolean;
  schedules: Schedule[];
  campaigns: Campaign[];
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAY_LABELS_LONG = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const STATUS_COLOR: Record<ScheduleStatus, string> = {
  SCHEDULED: "bg-blue-400/[0.08] text-blue-300 border-blue-400/20",
  ACTIVE: "bg-[#B8EB23]/[0.1] text-[#B8EB23] border-[#B8EB23]/25",
  PAUSED: "bg-amber-400/[0.08] text-amber-300 border-amber-400/20",
  COMPLETED: "bg-white/[0.04] text-white/40 border-white/[0.06]",
  CONFLICT: "bg-red-400/[0.1] text-red-300 border-red-400/25",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function CalendarClient({ canManage, schedules, campaigns }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"timeline" | "week">("timeline");
  const [weekOffset, setWeekOffset] = useState(0);
  const [pending, startTransition] = useTransition();

  const conflicts = schedules.filter((s) => s.status === "CONFLICT").length;

  const toggleStatus = (s: Schedule, next: ScheduleStatus) => {
    startTransition(async () => {
      const res = await updateScheduleStatus(s.id, next);
      if (res.ok) { toast.success("Estado actualizado"); router.refresh(); }
      else toast.error(res.error);
    });
  };
  const remove = (s: Schedule) => {
    if (!confirm(`¿Eliminar el horario "${s.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteSchedule(s.id);
      if (res.ok) { toast.success("Eliminado"); router.refresh(); }
      else toast.error(res.error);
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-[#B8EB23]" />
            Calendario de campañas
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            {schedules.length} horarios programados
            {conflicts > 0 && <span className="text-red-300"> · {conflicts} con conflicto</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setView("timeline")}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", view === "timeline" ? "bg-[#B8EB23]/10 text-[#B8EB23]" : "text-white/40 hover:text-white")}
            >
              Línea de tiempo
            </button>
            <button
              onClick={() => setView("week")}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", view === "week" ? "bg-[#B8EB23]/10 text-[#B8EB23]" : "text-white/40 hover:text-white")}
            >
              Semana
            </button>
          </div>
          {canManage && (
            <Button onClick={() => setOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              Nuevo horario
            </Button>
          )}
        </div>
      </div>

      {conflicts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3 rounded-xl bg-red-400/[0.06] border border-red-400/20"
        >
          <AlertTriangle className="w-4 h-4 text-red-300 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-red-300/90">
            <strong>Conflicto detectado:</strong> {conflicts} horario{conflicts > 1 ? "s" : ""} con la misma prioridad se superponen en días y horas. Ajusta la prioridad o cambia el rango horario.
          </div>
        </motion.div>
      )}

      {view === "timeline" ? (
        <Card>
          <CardHeader title="Línea de tiempo" subtitle="Todos los horarios ordenados por fecha de inicio" />
          <CardContent className="py-3">
            {schedules.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarRange className="w-10 h-10 text-white/15 mx-auto mb-3" />
                <p className="text-sm text-white/40">Aún no has programado campañas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schedules.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.4) }}
                    className={cn("rounded-xl border p-3.5 flex items-center gap-3 flex-wrap", STATUS_COLOR[s.status])}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/40">
                          P{s.priority}
                        </span>
                        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider", STATUS_COLOR[s.status])}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 truncate">
                        {s.campaignName} {s.clientName && `· ${s.clientName}`}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/60 flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarRange className="w-3 h-3" />
                          {fmtDate(s.startDate)} → {fmtDate(s.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {String(s.startHour).padStart(2, "0")}:00 – {String(s.endHour).padStart(2, "0")}:00
                        </span>
                        <span className="flex items-center gap-1">
                          {s.activeDays.map((d) => DAY_LABELS[d - 1] ?? DAY_LABELS[6]).join(" ")}
                        </span>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        {s.status === "ACTIVE" || s.status === "SCHEDULED" ? (
                          <button onClick={() => toggleStatus(s, "PAUSED")} disabled={pending} title="Pausar" className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white">
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => toggleStatus(s, "ACTIVE")} disabled={pending} title="Reanudar" className="p-1.5 rounded-lg hover:bg-[#B8EB23]/[0.1] text-white/60 hover:text-[#B8EB23]">
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => remove(s)} disabled={pending} title="Eliminar" className="p-1.5 rounded-lg hover:bg-red-400/[0.1] text-white/60 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <WeekView schedules={schedules} weekOffset={weekOffset} setWeekOffset={setWeekOffset} />
      )}

      <AnimatePresence>
        {open && <NewScheduleModal campaigns={campaigns} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function WeekView({ schedules, weekOffset, setWeekOffset }: { schedules: Schedule[]; weekOffset: number; setWeekOffset: (n: number) => void }) {
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1) + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [weekOffset]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <Card>
      <CardHeader
        title={`Semana de ${weekStart.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}`}
        subtitle="Vista semanal por horarios programados"
        action={
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1.5 rounded-lg text-white/60 hover:bg-white/[0.05]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setWeekOffset(0)} className="px-2 py-1 rounded-lg text-[11px] text-white/60 hover:bg-white/[0.05]">
              Hoy
            </button>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1.5 rounded-lg text-white/60 hover:bg-white/[0.05]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        }
      />
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => {
            const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
            const todays = schedules.filter((s) => {
              if (!s.activeDays.includes(dayOfWeek)) return false;
              const sd = new Date(s.startDate);
              const ed = new Date(s.endDate);
              return d >= sd && d <= ed;
            });
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border p-2 min-h-[200px] flex flex-col gap-1",
                  isToday ? "bg-[#B8EB23]/[0.04] border-[#B8EB23]/20" : "bg-white/[0.02] border-white/[0.05]",
                )}
              >
                <div className="text-center pb-1.5 border-b border-white/[0.04] mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{DAY_LABELS[i]}</p>
                  <p className={cn("text-base font-bold", isToday ? "text-[#B8EB23]" : "text-white")}>{d.getDate()}</p>
                </div>
                {todays.map((s) => (
                  <div
                    key={s.id}
                    className={cn("rounded-md px-1.5 py-1 text-[10px] truncate border", STATUS_COLOR[s.status])}
                    title={`${s.name} · ${String(s.startHour).padStart(2, "0")}:00 - ${String(s.endHour).padStart(2, "0")}:00`}
                  >
                    <p className="font-semibold truncate">{s.name}</p>
                    <p className="opacity-70">{String(s.startHour).padStart(2, "0")}–{String(s.endHour).padStart(2, "0")}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function NewScheduleModal({ campaigns, onClose }: { campaigns: Campaign[]; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(22);
  const [priority, setPriority] = useState(5);

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  const submit = () => {
    if (!campaignId || !name.trim()) { toast.error("Completa los campos requeridos"); return; }
    startTransition(async () => {
      const res = await createSchedule({
        campaignId, name,
        startDate, endDate,
        timezone: "America/Bogota",
        activeDays: days, startHour, endHour, priority,
      });
      if (res.ok) {
        if (res.data?.status === "CONFLICT") toast.error("Horario creado, pero entró en conflicto. Revísalo.");
        else toast.success("Horario creado");
        router.refresh();
        onClose();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="w-full max-w-lg rounded-2xl bg-[#111111] border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Nuevo horario</h3>
            <p className="text-xs text-white/40 mt-0.5">Programa cuándo se ejecuta una campaña</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 mb-1.5 block">Campaña</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#B8EB23]/40"
            >
              {campaigns.length === 0 && <option value="">— Sin campañas aún —</option>}
              {campaigns.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#111111]">
                  {c.name} {c.clientName ? `· ${c.clientName}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 mb-1.5 block">Nombre del horario</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Prime time semana"
              className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#B8EB23]/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-white/50 mb-1.5 block">Inicio</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 mb-1.5 block">Fin</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 mb-1.5 block">Días activos</label>
            <div className="grid grid-cols-7 gap-1">
              {DAY_LABELS_LONG.map((label, idx) => {
                const d = idx + 1;
                const active = days.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={cn(
                      "py-2 rounded-lg text-xs font-medium border transition-all",
                      active
                        ? "bg-[#B8EB23]/10 border-[#B8EB23]/30 text-[#B8EB23]"
                        : "bg-white/[0.02] border-white/[0.05] text-white/40 hover:text-white",
                    )}
                  >
                    {DAY_LABELS[idx]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-white/50 mb-1.5 block">Inicio (hora)</label>
              <input type="number" min={0} max={23} value={startHour} onChange={(e) => setStartHour(Number(e.target.value))} className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 mb-1.5 block">Fin (hora)</label>
              <input type="number" min={1} max={24} value={endHour} onChange={(e) => setEndHour(Number(e.target.value))} className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 mb-1.5 block">Prioridad</label>
              <input type="number" min={1} max={10} value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white" />
            </div>
          </div>
          <Button onClick={submit} disabled={pending || !campaignId} icon={<Plus className="w-3.5 h-3.5" />} className="w-full">
            {pending ? "Creando…" : "Crear horario"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
