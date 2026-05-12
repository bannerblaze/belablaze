"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Mail, Phone, Globe, MapPin, DollarSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/actions/clients";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  industry: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

const INDUSTRIES = ["Retail", "Bebidas", "Alimentos", "Fintech", "Telecomunicaciones", "Tecnología", "Salud", "Automotriz", "Entretenimiento", "Otro"];

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function ClientFormModal({ open, onClose, onSuccess }: ClientFormProps) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: "", email: "", creditLimit: 0 },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("name", data.name);
        fd.append("email", data.email);
        fd.append("industry", data.industry ?? "");
        fd.append("city", data.city ?? "");
        fd.append("phone", data.phone ?? "");
        fd.append("website", data.website ?? "");
        fd.append("creditLimit", (data.creditLimit ?? 0).toString());
        await createClient(fd);
        toast.success("Cliente creado exitosamente");
        reset();
        onSuccess?.();
        onClose();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al crear el cliente";
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[520px] max-h-[90vh] overflow-y-auto bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl z-50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#B8EB23]/10 flex items-center justify-center text-[#B8EB23]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nuevo cliente</h3>
                  <p className="text-xs text-white/40">Completa los datos del cliente</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Nombre de la empresa" error={errors.name?.message} required>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input {...register("name")} placeholder="Ej: Grupo Éxito S.A." className={cn(inputCls, "pl-9")} />
                    </div>
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Email de contacto" error={errors.email?.message} required>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input {...register("email")} type="email" placeholder="contacto@empresa.com" className={cn(inputCls, "pl-9")} />
                    </div>
                  </Field>
                </div>

                <Field label="Industria">
                  <select {...register("industry")} className={cn(inputCls, "text-white/70")}>
                    <option value="" className="bg-[#1a1a1a]">Seleccionar...</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i} className="bg-[#1a1a1a]">{i}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Ciudad">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input {...register("city")} placeholder="Medellín" className={cn(inputCls, "pl-9")} />
                  </div>
                </Field>

                <Field label="Teléfono">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input {...register("phone")} placeholder="+57 300 000 0000" className={cn(inputCls, "pl-9")} />
                  </div>
                </Field>

                <Field label="Sitio web">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input {...register("website")} placeholder="https://empresa.com" className={cn(inputCls, "pl-9")} />
                  </div>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Límite de crédito (COP)" error={errors.creditLimit?.message}>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        {...register("creditLimit", { valueAsNumber: true })}
                        type="number"
                        min={0}
                        placeholder="0"
                        className={cn(inputCls, "pl-9")}
                      />
                    </div>
                  </Field>
                </div>
              </div>

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
                  Crear cliente
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
