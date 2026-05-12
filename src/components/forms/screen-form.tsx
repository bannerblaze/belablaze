"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, MonitorPlay, MapPin, Maximize2, DollarSign, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createScreen } from "@/actions/screens";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  type: z.string().min(1, "Selecciona tipo"),
  city: z.string().min(2, "Ingresa la ciudad"),
  address: z.string().min(5, "Ingresa la dirección completa"),
  width: z.number().positive("Ancho requerido"),
  height: z.number().positive("Alto requerido"),
  resolutionWidth: z.number().optional(),
  resolutionHeight: z.number().optional(),
  dailyTraffic: z.number().min(0).optional(),
  pricePerSecond: z.number().min(0).optional(),
  orientation: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const SCREEN_TYPES = [
  { value: "LED_OUTDOOR", label: "LED Exterior" },
  { value: "LED_INDOOR", label: "LED Interior" },
  { value: "LCD", label: "LCD" },
  { value: "PROJECTION", label: "Proyección" },
  { value: "INTERACTIVE", label: "Interactivo" },
];

const COLOMBIAN_CITIES = [
  "Medellín", "Bogotá", "Bello", "Envigado", "Itagüí", "Manizales",
  "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira",
];

interface ScreenFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function ScreenFormModal({ open, onClose, onSuccess }: ScreenFormProps) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      type: "LED_OUTDOOR",
      orientation: "landscape",
      resolutionWidth: 1920,
      resolutionHeight: 1080,
      dailyTraffic: 0,
      pricePerSecond: 0,
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await createScreen({
          name: data.name,
          type: data.type,
          city: data.city,
          address: data.address,
          width: data.width,
          height: data.height,
          resolutionWidth: data.resolutionWidth,
          resolutionHeight: data.resolutionHeight,
          dailyTraffic: data.dailyTraffic,
          pricePerSecond: data.pricePerSecond,
          orientation: data.orientation,
          notes: data.notes,
        });
        toast.success("Pantalla creada exitosamente");
        reset();
        onSuccess?.();
        onClose();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al crear la pantalla";
        toast.error(msg);
      }
    });
  };

  const inputCls = "w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 transition-all";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[560px] max-h-[90vh] overflow-y-auto bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl z-50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#B8EB23]/10 flex items-center justify-center text-[#B8EB23]">
                  <MonitorPlay className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nueva pantalla DOOH</h3>
                  <p className="text-xs text-white/40">Registra una nueva pantalla en la red</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Field label="Nombre de la pantalla *" error={errors.name?.message}>
                <input {...register("name")} placeholder="Ej: LED Éxito — Envigado" className={inputCls} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo de pantalla *" error={errors.type?.message}>
                  <select {...register("type")} className={cn(inputCls, "text-white/80")}>
                    {SCREEN_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-[#1a1a1a]">{t.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Orientación">
                  <select {...register("orientation")} className={cn(inputCls, "text-white/80")}>
                    <option value="landscape" className="bg-[#1a1a1a]">Horizontal</option>
                    <option value="portrait" className="bg-[#1a1a1a]">Vertical</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Ciudad *" error={errors.city?.message}>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      {...register("city")}
                      list="city-list"
                      placeholder="Medellín"
                      className={cn(inputCls, "pl-9")}
                    />
                    <datalist id="city-list">
                      {COLOMBIAN_CITIES.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </Field>

                <Field label="Dirección *" error={errors.address?.message}>
                  <input {...register("address")} placeholder="Cra 43A #1 Sur" className={inputCls} />
                </Field>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                  <Maximize2 className="w-3 h-3" /> Dimensiones
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ancho físico (m) *" error={errors.width?.message}>
                    <input {...register("width", { valueAsNumber: true })} type="number" min={0} step={0.1} placeholder="6" className={inputCls} />
                  </Field>
                  <Field label="Alto físico (m) *" error={errors.height?.message}>
                    <input {...register("height", { valueAsNumber: true })} type="number" min={0} step={0.1} placeholder="3" className={inputCls} />
                  </Field>
                  <Field label="Resolución ancho (px)">
                    <input {...register("resolutionWidth", { valueAsNumber: true })} type="number" placeholder="1920" className={inputCls} />
                  </Field>
                  <Field label="Resolución alto (px)">
                    <input {...register("resolutionHeight", { valueAsNumber: true })} type="number" placeholder="1080" className={inputCls} />
                  </Field>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Tráfico diario estimado">
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input {...register("dailyTraffic", { valueAsNumber: true })} type="number" min={0} placeholder="50000" className={cn(inputCls, "pl-9")} />
                  </div>
                </Field>

                <Field label="Precio por segundo (COP)">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input {...register("pricePerSecond", { valueAsNumber: true })} type="number" min={0} step={0.01} placeholder="1500" className={cn(inputCls, "pl-9")} />
                  </div>
                </Field>
              </div>

              <Field label="Notas internas">
                <textarea
                  {...register("notes")}
                  placeholder="Observaciones, condiciones especiales, etc."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 resize-none transition-all"
                />
              </Field>

              <div className="flex items-center gap-3 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="brand"
                  size="sm"
                  loading={isPending}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  className="flex-1"
                >
                  Crear pantalla
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
