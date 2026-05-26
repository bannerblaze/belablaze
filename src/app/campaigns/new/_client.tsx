"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, CheckCircle2, DollarSign, Calendar,
  MapPin, AlignLeft, Building2, Plus, X, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createCampaign } from "@/actions/campaigns";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const COLOMBIAN_CITIES = [
  "Medellín", "Bogotá", "Bello", "Envigado", "Itagüí", "Manizales",
  "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Cúcuta",
];

const schema = z.object({
  name:        z.string().min(3, "Mínimo 3 caracteres"),
  description: z.string().optional(),
  clientId:    z.string().min(1, "Selecciona un cliente"),
  budget:      z.number().positive("El presupuesto debe ser mayor a 0"),
  startDate:   z.string().min(1, "Selecciona la fecha de inicio"),
  endDate:     z.string().min(1, "Selecciona la fecha de fin"),
});

type FormValues = z.infer<typeof schema>;
type ClientRef = { id: string; name: string; industry?: string | null };

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all",
            i < current  ? "bg-[#B8EB23] text-black" :
            i === current ? "bg-[#B8EB23]/20 text-[#B8EB23] border border-[#B8EB23]/40" :
                            "bg-white/[0.06] text-white/30",
          )}>
            {i < current ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={cn(
            "text-xs font-medium hidden sm:inline",
            i === current ? "text-white" : i < current ? "text-[#B8EB23]" : "text-white/30",
          )}>
            {step}
          </span>
          {i < steps.length - 1 && (
            <div className={cn("w-6 h-px mx-1", i < current ? "bg-[#B8EB23]/40" : "bg-white/[0.08]")} />
          )}
        </div>
      ))}
    </div>
  );
}

function InputField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

interface Props {
  clients:      ClientRef[];
  isAdmin:      boolean;
  autoClientId?: string;
}

export function NewCampaignClient({ clients, isAdmin, autoClientId }: Props) {
  const router   = useRouter();
  const STEPS    = isAdmin
    ? ["Cliente", "Detalles", "Presupuesto & Fechas", "Confirmar"]
    : ["Detalles", "Presupuesto & Fechas", "Confirmar"];
  const STEP_OFFSET = isAdmin ? 0 : 1; // maps internal step index → form-step index

  const [step,          setStep]          = useState(0);
  const [isPending,     startTransition]  = useTransition();
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [customCity,    setCustomCity]    = useState("");

  const { register, handleSubmit, watch, formState: { errors }, trigger, setValue } = useForm<FormValues>({
    defaultValues: {
      name: "", description: "",
      clientId: autoClientId ?? "",
      budget: undefined, startDate: "", endDate: "",
    },
  });

  const values = watch();

  // Keep autoClientId in sync as a hidden field for non-admins
  if (!isAdmin && values.clientId !== (autoClientId ?? "")) {
    setValue("clientId", autoClientId ?? "");
  }

  const toggleCity = (city: string) =>
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    );

  const addCustomCity = () => {
    if (customCity.trim() && !selectedCities.includes(customCity.trim())) {
      setSelectedCities((prev) => [...prev, customCity.trim()]);
      setCustomCity("");
    }
  };

  const canGoNext = async () => {
    const formStep = step + STEP_OFFSET;
    if (formStep === 0) return trigger("clientId");
    if (formStep === 1) return trigger(["name", "description"]);
    if (formStep === 2) return trigger(["budget", "startDate", "endDate"]);
    return true;
  };

  const handleNext = async () => {
    if (await canGoNext()) setStep((s) => s + 1);
  };

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("name",        data.name);
        fd.append("description", data.description ?? "");
        fd.append("clientId",    data.clientId);
        fd.append("budget",      data.budget.toString());
        fd.append("startDate",   data.startDate);
        fd.append("endDate",     data.endDate);
        fd.append("targetCities", selectedCities.join(","));

        const result = await createCampaign(fd);

        if (isAdmin) {
          toast.success("Campaña creada exitosamente");
        } else {
          toast.success("Tu campaña fue enviada a revisión.");
        }

        router.push(`/campaigns/${result.id}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al crear la campaña. Intenta de nuevo.");
      }
    });
  };

  const selectedClient = clients.find((c) => c.id === values.clientId);
  const formStep       = step + STEP_OFFSET; // 0=client,1=details,2=budget,3=confirm

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 max-w-[720px] space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => step > 0 ? setStep(step - 1) : router.push("/campaigns")}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">Nueva campaña</h2>
          <p className="text-xs text-white/40">Completa los pasos para crear la campaña</p>
        </div>
        <StepIndicator current={step} steps={STEPS} />
      </div>

      {/* Non-admin: no client yet */}
      {!isAdmin && !autoClientId && (
        <Card>
          <CardContent className="py-10 text-center">
            <Building2 className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/50 mb-1">Necesitas un cliente antes de crear una campaña.</p>
            <button
              type="button"
              onClick={() => router.push("/clients/new")}
              className="text-xs text-[#B8EB23] hover:underline mt-1"
            >
              Crear cliente →
            </button>
          </CardContent>
        </Card>
      )}

      {(isAdmin || !!autoClientId) && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 0 (admin only): Select client */}
              {formStep === 0 && (
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-[#B8EB23]/10 flex items-center justify-center text-[#B8EB23]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Selecciona el cliente</p>
                        <p className="text-xs text-white/40">¿Para qué cliente es esta campaña?</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {clients.map((client) => (
                        <label
                          key={client.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                            values.clientId === client.id
                              ? "bg-[#B8EB23]/[0.06] border-[#B8EB23]/30"
                              : "bg-white/[0.03] border-white/[0.08] hover:border-white/15",
                          )}
                        >
                          <input type="radio" value={client.id} {...register("clientId")} className="sr-only" />
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            values.clientId === client.id ? "border-[#B8EB23] bg-[#B8EB23]" : "border-white/20",
                          )}>
                            {values.clientId === client.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                          <div className="min-w-0">
                            <p className={cn("text-sm font-medium", values.clientId === client.id ? "text-[#B8EB23]" : "text-white")}>
                              {client.name}
                            </p>
                            {client.industry && <p className="text-[11px] text-white/40">{client.industry}</p>}
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.clientId && <p className="text-xs text-red-400">{errors.clientId.message}</p>}

                    {clients.length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-sm text-white/40">No hay clientes registrados aún.</p>
                        <button
                          type="button"
                          onClick={() => router.push("/clients/new")}
                          className="text-xs text-[#B8EB23] hover:underline mt-2"
                        >
                          Crear primer cliente →
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* STEP 1: Name + Description + Cities */}
              {formStep === 1 && (
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-[#B8EB23]/10 flex items-center justify-center text-[#B8EB23]">
                        <AlignLeft className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Detalles de la campaña</p>
                        <p className="text-xs text-white/40">Nombre, descripción y ciudades objetivo</p>
                      </div>
                    </div>

                    <InputField label="Nombre de la campaña *" error={errors.name?.message}>
                      <input
                        {...register("name")}
                        type="text"
                        placeholder="Ej: Campaña verano Éxito 2025"
                        className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                      />
                    </InputField>

                    <InputField label="Descripción (opcional)">
                      <textarea
                        {...register("description")}
                        placeholder="Objetivo, audiencia, mensaje principal..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 resize-none transition-all"
                      />
                    </InputField>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> Ciudades objetivo
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {COLOMBIAN_CITIES.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => toggleCity(city)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                              selectedCities.includes(city)
                                ? "bg-[#B8EB23]/10 border-[#B8EB23]/30 text-[#B8EB23]"
                                : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white hover:border-white/15",
                            )}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCity())}
                          placeholder="Otra ciudad..."
                          className="flex-1 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                        />
                        <button
                          type="button"
                          onClick={addCustomCity}
                          className="h-9 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white text-xs transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {selectedCities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedCities.map((c) => (
                            <span key={c} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#B8EB23]/10 border border-[#B8EB23]/20 text-[#B8EB23] text-xs">
                              {c}
                              <button type="button" onClick={() => toggleCity(c)}><X className="w-2.5 h-2.5" /></button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 2: Budget & Dates */}
              {formStep === 2 && (
                <Card>
                  <CardContent className="p-5 space-y-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-[#B8EB23]/10 flex items-center justify-center text-[#B8EB23]">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Presupuesto y fechas</p>
                        <p className="text-xs text-white/40">Define el presupuesto y período de la campaña</p>
                      </div>
                    </div>

                    <InputField label="Presupuesto total (COP) *" error={errors.budget?.message}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                        <input
                          {...register("budget", { valueAsNumber: true })}
                          type="number"
                          placeholder="5,000,000"
                          min={0}
                          className="w-full h-10 pl-7 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                        />
                      </div>
                    </InputField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField label="Fecha de inicio *" error={errors.startDate?.message}>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            {...register("startDate")}
                            type="date"
                            className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                          />
                        </div>
                      </InputField>

                      <InputField label="Fecha de fin *" error={errors.endDate?.message}>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            {...register("endDate")}
                            type="date"
                            className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                          />
                        </div>
                      </InputField>
                    </div>

                    {values.budget > 0 && (
                      <div className="p-3 rounded-xl bg-[#B8EB23]/[0.04] border border-[#B8EB23]/15">
                        <p className="text-xs text-white/50 mb-1">Estimado diario</p>
                        {values.startDate && values.endDate ? (() => {
                          const days = Math.max(1, Math.ceil(
                            (new Date(values.endDate).getTime() - new Date(values.startDate).getTime()) / 86400000,
                          ));
                          return (
                            <p className="text-sm font-bold text-[#B8EB23]">
                              ${(values.budget / days).toLocaleString("es-CO", { maximumFractionDigits: 0 })} COP / día · {days} días
                            </p>
                          );
                        })() : (
                          <p className="text-xs text-white/30">Selecciona fechas para ver el estimado diario</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* STEP 3: Confirm */}
              {formStep === 3 && (
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center",
                        isAdmin ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400",
                      )}>
                        {isAdmin ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Confirmar campaña</p>
                        <p className="text-xs text-white/40">Revisa los datos antes de crear</p>
                      </div>
                    </div>

                    <div className="space-y-0">
                      {[
                        isAdmin && { label: "Cliente",      value: selectedClient?.name ?? "—" },
                        { label: "Nombre",       value: values.name || "—" },
                        { label: "Descripción",  value: values.description || "Sin descripción" },
                        { label: "Presupuesto",  value: values.budget ? `$${values.budget.toLocaleString("es-CO")} COP` : "—" },
                        { label: "Inicio",       value: values.startDate || "—" },
                        { label: "Fin",          value: values.endDate || "—" },
                        { label: "Ciudades",     value: selectedCities.length > 0 ? selectedCities.join(", ") : "Sin ciudades definidas" },
                      ].filter((x): x is { label: string; value: string } => Boolean(x)).map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between py-3 border-b border-white/[0.04] last:border-0 gap-4">
                          <span className="text-xs text-white/40 flex-shrink-0 w-24">{label}</span>
                          <span className="text-xs font-medium text-white text-right">{value}</span>
                        </div>
                      ))}
                    </div>

                    {isAdmin ? (
                      <div className="p-3 rounded-xl bg-blue-400/[0.06] border border-blue-400/15">
                        <p className="text-xs text-blue-400">
                          La campaña se creará en estado <strong>Borrador</strong>. Podrás activarla cuando los anuncios estén aprobados.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-yellow-400/[0.06] border border-yellow-400/15">
                        <p className="text-xs text-yellow-400">
                          Tu campaña será enviada a <strong>revisión</strong>. Un administrador la aprobará antes de activarla.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => step > 0 ? setStep(step - 1) : router.push("/campaigns")}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              {step === 0 ? "Cancelar" : "Atrás"}
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" variant="brand" size="sm" onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button
                type="submit"
                variant="brand"
                size="sm"
                loading={isPending}
                icon={isAdmin ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              >
                {isAdmin ? "Crear campaña" : "Enviar a revisión"}
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
