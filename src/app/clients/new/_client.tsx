"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ChevronLeft, Building2, Mail, Phone, Briefcase, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { createClient } from "@/actions/clients";

const schema = z.object({
  name:     z.string().min(2, "Mínimo 2 caracteres"),
  email:    z.string().email("Email inválido").or(z.literal("")).optional(),
  phone:    z.string().optional(),
  industry: z.string().optional(),
  city:     z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function Field({
  label, icon, error, children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-white/60 uppercase tracking-wider">
        {icon}
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const INPUT =
  "w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 focus:bg-white/[0.06] transition-all";

export function NewClientClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", industry: "", city: "" },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("name",     data.name);
        fd.append("email",    data.email    ?? "");
        fd.append("phone",    data.phone    ?? "");
        fd.append("industry", data.industry ?? "");
        fd.append("city",     data.city     ?? "");
        await createClient(fd);
        toast.success("Cliente creado exitosamente");
        router.push("/clients");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al crear cliente");
      }
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 max-w-[600px] space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={() => router.push("/clients")}
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">Nuevo cliente</h1>
          <p className="text-xs text-white/40">Completa los datos del cliente</p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#B8EB23]/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#B8EB23]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Información del cliente</p>
                <p className="text-xs text-white/40">Los campos marcados con * son obligatorios</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Field
                label="Nombre del cliente *"
                icon={<Building2 className="w-3 h-3" />}
                error={errors.name?.message}
              >
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Ej: Éxito, Bancolombia, Nike Colombia"
                  className={INPUT}
                />
              </Field>

              <Field
                label="Email"
                icon={<Mail className="w-3 h-3" />}
                error={errors.email?.message}
              >
                <input
                  {...register("email")}
                  type="email"
                  placeholder="contacto@empresa.com"
                  className={INPUT}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Teléfono"
                  icon={<Phone className="w-3 h-3" />}
                  error={errors.phone?.message}
                >
                  <input
                    {...register("phone")}
                    type="tel"
                    placeholder="+57 300 000 0000"
                    className={INPUT}
                  />
                </Field>

                <Field
                  label="Industria"
                  icon={<Briefcase className="w-3 h-3" />}
                  error={errors.industry?.message}
                >
                  <input
                    {...register("industry")}
                    type="text"
                    placeholder="Retail, Finanzas, Salud..."
                    className={INPUT}
                  />
                </Field>
              </div>

              <Field
                label="Ciudad"
                icon={<MapPin className="w-3 h-3" />}
                error={errors.city?.message}
              >
                <input
                  {...register("city")}
                  type="text"
                  placeholder="Medellín"
                  className={INPUT}
                />
              </Field>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/clients")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="brand"
                  size="sm"
                  loading={isPending}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Crear cliente
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
