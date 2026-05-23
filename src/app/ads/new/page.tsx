"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Image as ImageIcon, Video, Code, Zap,
  ChevronLeft, CheckCircle2, QrCode, Clock,
  Calendar, Link2, AlignLeft, MonitorPlay, X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { createAd, submitAdForReview, linkAdMedia } from "@/actions/ads";

type AdFormat = "IMAGE" | "VIDEO" | "HTML5" | "INTERACTIVE";

const FORMAT_OPTIONS: Array<{
  value: AdFormat;
  label: string;
  desc: string;
  icon: React.ReactNode;
  accept: string;
}> = [
  { value: "IMAGE", label: "Imagen", desc: "JPG, PNG, WebP · máx. 10MB", icon: <ImageIcon className="w-5 h-5" />, accept: "image/*" },
  { value: "VIDEO", label: "Video", desc: "MP4, WebM · máx. 100MB", icon: <Video className="w-5 h-5" />, accept: "video/*" },
  { value: "HTML5", label: "HTML5", desc: "Archivo ZIP con index.html", icon: <Code className="w-5 h-5" />, accept: ".zip" },
  { value: "INTERACTIVE", label: "Interactivo", desc: "QR + contenido dinámico", icon: <Zap className="w-5 h-5" />, accept: "image/*,video/*" },
];

const STEPS = ["Formato", "Contenido", "Programación", "Confirmar"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all",
            i < current ? "bg-[#B8EB23] text-black" :
            i === current ? "bg-[#B8EB23]/20 text-[#B8EB23] border border-[#B8EB23]/40" :
            "bg-white/[0.06] text-white/30"
          )}>
            {i < current ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={cn(
            "text-xs font-medium hidden sm:inline",
            i === current ? "text-white" : i < current ? "text-[#B8EB23]" : "text-white/30"
          )}>
            {step}
          </span>
          {i < STEPS.length - 1 && (
            <div className={cn("w-8 h-px mx-1", i < current ? "bg-[#B8EB23]/40" : "bg-white/[0.08]")} />
          )}
        </div>
      ))}
    </div>
  );
}

function DropZone({ format, onFile }: { format: AdFormat; onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); onFile(f); }
  }, [onFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); onFile(f); }
  };

  const accepted = FORMAT_OPTIONS.find((fo) => fo.value === format);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden",
        dragging
          ? "border-[#B8EB23] bg-[#B8EB23]/[0.06] scale-[1.01]"
          : file
          ? "border-green-400/40 bg-green-400/[0.04]"
          : "border-white/[0.1] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]"
      )}
    >
      <label className="flex flex-col items-center justify-center gap-3 p-10 cursor-pointer">
        <input type="file" className="sr-only" accept={accepted?.accept} onChange={handleChange} />
        {file ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center text-green-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">{file.name}</p>
              <p className="text-xs text-white/40 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setFile(null); }}
              className="text-xs text-white/40 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Cambiar archivo
            </button>
          </>
        ) : (
          <>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", dragging ? "bg-[#B8EB23]/20 text-[#B8EB23]" : "bg-white/[0.06] text-white/40")}>
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">{dragging ? "Suelta el archivo aquí" : "Arrastra o haz clic para subir"}</p>
              <p className="text-xs text-white/40 mt-1">{accepted?.desc}</p>
            </div>
          </>
        )}
      </label>
    </div>
  );
}

type Campaign = { id: string; name: string; client?: { name: string } | null };
type Screen = { id: string; name: string; city: string; code: string; status: string };

function NewAdPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCampaignId = searchParams.get("campaignId") ?? "";

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Crear anuncio");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    format: "IMAGE" as AdFormat,
    campaignId: preSelectedCampaignId,
    title: "",
    description: "",
    file: null as File | null,
    duration: 15,
    ctaText: "",
    ctaUrl: "",
    qrEnabled: false,
    startDate: "",
    endDate: "",
    selectedScreens: [] as string[],
    startTime: "08:00",
    endTime: "22:00",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch("/api/campaigns?limit=100"),
          fetch("/api/screens?limit=100"),
        ]);
        const cData = await cRes.json();
        const sData = await sRes.json();
        setCampaigns(cData.data ?? []);
        setScreens((sData.data ?? []).filter((s: Screen) => s.status === "ONLINE"));
      } catch {
        toast.error("Error cargando datos");
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const toggleScreen = (id: string) => {
    set("selectedScreens",
      form.selectedScreens.includes(id)
        ? form.selectedScreens.filter((s) => s !== id)
        : [...form.selectedScreens, id]
    );
  };

  const canNext = () => {
    if (step === 0) return !!form.format && !!form.campaignId;
    if (step === 1) return !!form.title;
    if (step === 2) return !!form.startDate && !!form.endDate;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Step 1: create the ad record
      setLoadingLabel("Creando anuncio...");
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("campaignId", form.campaignId);
      fd.append("format", form.format);
      fd.append("duration", form.duration.toString());
      fd.append("ctaText", form.ctaText);
      fd.append("ctaUrl", form.ctaUrl);
      fd.append("qrEnabled", form.qrEnabled.toString());
      const result = await createAd(fd);

      if (result?.success && result.id) {
        // Step 2: upload media if file was provided
        if (form.file) {
          setLoadingLabel("Subiendo archivo...");
          const uploadFd = new FormData();
          uploadFd.append("file", form.file);
          const uploadRes = await fetch("/api/media/upload", {
            method: "POST",
            body: uploadFd,
          });
          const uploadData = await uploadRes.json() as { ok: boolean; asset?: { id: string; url: string }; error?: string };
          if (!uploadData.ok || !uploadData.asset) {
            throw new Error(uploadData.error ?? "Error subiendo el archivo");
          }
          await linkAdMedia(result.id, uploadData.asset.id, uploadData.asset.url);
        }

        // Step 3: submit for review
        setLoadingLabel("Enviando a revisión...");
        await submitAdForReview(result.id);
      }

      toast.success("Anuncio creado y enviado a revisión.");
      router.push("/ads");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear el anuncio. Intenta de nuevo.");
    } finally {
      setLoading(false);
      setLoadingLabel("Crear anuncio");
    }
  };

  const selectedCampaign = campaigns.find((c) => c.id === form.campaignId);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 max-w-[860px] space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : router.push("/ads")}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white">Nuevo anuncio</h2>
          <p className="text-xs text-white/40">Los anuncios pasan por revisión antes de publicarse</p>
        </div>
        <div className="ml-auto">
          <StepIndicator current={step} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
        >
          {/* STEP 0: Format + Campaign */}
          {step === 0 && (
            <div className="space-y-5">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Campaña asociada *</label>
                    {loadingData ? (
                      <div className="mt-2 h-10 rounded-lg bg-white/[0.04] animate-pulse" />
                    ) : (
                      <select
                        value={form.campaignId}
                        onChange={(e) => set("campaignId", e.target.value)}
                        className="mt-2 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                      >
                        <option value="" className="bg-[#1a1a1a]">Selecciona una campaña...</option>
                        {campaigns.map((c) => (
                          <option key={c.id} value={c.id} className="bg-[#1a1a1a]">
                            {c.name}{c.client?.name ? ` — ${c.client.name}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Formato del anuncio</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {FORMAT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => set("format", opt.value)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                            form.format === opt.value
                              ? "bg-[#B8EB23]/10 border-[#B8EB23]/40 text-[#B8EB23]"
                              : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white hover:border-white/15"
                          )}
                        >
                          {opt.icon}
                          <span className="text-xs font-semibold">{opt.label}</span>
                          <span className="text-[10px] text-current opacity-60">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 1: Content */}
          {step === 1 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Título del anuncio *</label>
                      <input
                        type="text"
                        placeholder="Ej: Campaña verano 2025"
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                        className="mt-2 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Duración (segundos)</label>
                      <div className="mt-2 flex items-center gap-2">
                        {[10, 15, 20, 30].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => set("duration", d)}
                            className={cn(
                              "flex-1 h-10 rounded-lg text-sm font-medium transition-all border",
                              form.duration === d
                                ? "bg-[#B8EB23]/10 border-[#B8EB23]/40 text-[#B8EB23]"
                                : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white"
                            )}
                          >
                            {d}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Descripción (opcional)</label>
                    <textarea
                      placeholder="Descripción breve del anuncio..."
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      rows={2}
                      className="mt-2 w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 resize-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Archivo creativo</label>
                    <div className="mt-2">
                      <DropZone format={form.format} onFile={(f) => set("file", f)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
                    <div>
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                        <Link2 className="w-3 h-3" /> Texto CTA
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Ver catálogo"
                        value={form.ctaText}
                        onChange={(e) => set("ctaText", e.target.value)}
                        className="mt-2 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">URL destino</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={form.ctaUrl}
                        onChange={(e) => set("ctaUrl", e.target.value)}
                        className="mt-2 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <QrCode className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Habilitar QR interactivo</p>
                        <p className="text-xs text-white/40">Genera un QR dinámico para interacción física-digital</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => set("qrEnabled", !form.qrEnabled)}
                      className={cn("relative w-11 h-6 rounded-full transition-all", form.qrEnabled ? "bg-[#B8EB23]" : "bg-white/[0.1]")}
                    >
                      <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", form.qrEnabled ? "left-6" : "left-1")} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 2: Schedule + Screens */}
          {step === 2 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> Fecha inicio *
                      </label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => set("startDate", e.target.value)}
                        className="mt-2 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> Fecha fin *
                      </label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => set("endDate", e.target.value)}
                        className="mt-2 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Hora inicio
                      </label>
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(e) => set("startTime", e.target.value)}
                        className="mt-2 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Hora fin
                      </label>
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(e) => set("endTime", e.target.value)}
                        className="mt-2 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#B8EB23]/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06]">
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                      <MonitorPlay className="w-3 h-3" /> Pantallas disponibles
                    </label>
                    <p className="text-[11px] text-white/30 mt-1 mb-3">
                      {form.selectedScreens.length} seleccionada{form.selectedScreens.length !== 1 ? "s" : ""} · Solo pantallas en línea
                    </p>
                    {loadingData ? (
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />)}
                      </div>
                    ) : screens.length === 0 ? (
                      <p className="text-xs text-white/30 py-4">No hay pantallas en línea disponibles</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {screens.map((screen) => {
                          const selected = form.selectedScreens.includes(screen.id);
                          return (
                            <button
                              key={screen.id}
                              type="button"
                              onClick={() => toggleScreen(screen.id)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                selected
                                  ? "bg-[#B8EB23]/[0.06] border-[#B8EB23]/30 text-[#B8EB23]"
                                  : "bg-white/[0.03] border-white/[0.08] hover:border-white/15 text-white/60"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                                selected ? "border-[#B8EB23] bg-[#B8EB23]" : "border-white/20"
                              )}>
                                {selected && <CheckCircle2 className="w-3 h-3 text-black" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{screen.name.split("—")[0].trim()}</p>
                                <p className="text-[10px] opacity-50 mt-0.5">{screen.city} · {screen.code}</p>
                              </div>
                              <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 bg-green-400" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 3: Confirm */}
          {step === 3 && (
            <Card>
              <CardContent className="p-5 space-y-5">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-400/[0.06] border border-yellow-400/20">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <p className="text-xs text-yellow-400/90 leading-relaxed">
                    El anuncio quedará en estado <strong>Pendiente de revisión</strong>. Un administrador lo revisará antes de programar su publicación.
                  </p>
                </div>

                <div className="space-y-0">
                  {[
                    { label: "Título", value: form.title || "—" },
                    { label: "Formato", value: FORMAT_OPTIONS.find((f) => f.value === form.format)?.label ?? form.format },
                    { label: "Campaña", value: selectedCampaign?.name ?? "—" },
                    { label: "Duración", value: `${form.duration}s` },
                    { label: "Archivo", value: form.file?.name ?? "Sin archivo (requerido en producción)" },
                    { label: "Pantallas", value: `${form.selectedScreens.length} seleccionada${form.selectedScreens.length !== 1 ? "s" : ""}` },
                    { label: "QR interactivo", value: form.qrEnabled ? "Habilitado" : "Deshabilitado" },
                    { label: "Período", value: form.startDate && form.endDate ? `${form.startDate} → ${form.endDate}` : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                      <span className="text-xs text-white/40">{label}</span>
                      <span className="text-xs font-medium text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => step > 0 ? setStep(step - 1) : router.push("/ads")}
          icon={<ChevronLeft className="w-4 h-4" />}
        >
          {step === 0 ? "Cancelar" : "Atrás"}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button variant="brand" size="sm" disabled={!canNext()} onClick={() => setStep(step + 1)}>
            Siguiente
          </Button>
        ) : (
          <Button variant="brand" size="sm" loading={loading} onClick={handleSubmit}>
            {loading ? loadingLabel : "Crear anuncio"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function NewAdPage() {
  return (
    <Suspense fallback={<div className="px-4 sm:px-6 lg:px-8 py-5 space-y-5"><div className="h-8 w-48 rounded-lg bg-white/[0.04] animate-pulse" /></div>}>
      <NewAdPageContent />
    </Suspense>
  );
}
