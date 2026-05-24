"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Plus, X, Trash2, Power } from "lucide-react";
import { createWebhook, toggleWebhook, deleteWebhook } from "@/actions/webhooks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const SUPPORTED_EVENTS = [
  "campaign.created",
  "campaign.approved",
  "campaign.completed",
  "ad.approved",
  "ad.rejected",
  "member.joined",
  "member.left",
  "media.uploaded",
];

type SerializedWebhook = {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
};

export function WebhooksClient({ hooks }: { hooks: SerializedWebhook[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  function handleCreate() {
    if (!url.trim()) {
      setError("La URL es requerida");
      return;
    }
    if (!url.startsWith("https://")) {
      setError("La URL debe usar HTTPS");
      return;
    }
    if (!selectedEvents.length) {
      setError("Selecciona al menos un evento");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await createWebhook(url.trim(), selectedEvents);
        setSecret(result.secret);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear webhook");
      }
    });
  }

  function handleClose() {
    setShowModal(false);
    setUrl("");
    setSelectedEvents([]);
    setSecret(null);
    setError(null);
    setCopied(false);
  }

  function handleCopy() {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      await toggleWebhook(id);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este webhook? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      await deleteWebhook(id);
      router.refresh();
    });
  }

  return (
    <>
      <Card>
        <CardHeader
          title={`${hooks.length} ${hooks.length === 1 ? "endpoint" : "endpoints"}`}
          subtitle="Configura URLs que reciben eventos en tiempo real"
          action={
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-black bg-[#B8EB23] hover:bg-[#B8EB23]/90 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              Nuevo Webhook
            </button>
          }
        />
        <CardContent className="py-3">
          {hooks.length === 0 ? (
            <p className="text-xs text-white/30 py-6 text-center">
              Aún no has registrado webhooks.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {hooks.map((h) => (
                <div key={h.id} className="py-3">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <code className="text-xs text-white font-mono truncate">{h.url}</code>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          h.isActive
                            ? "bg-[#B8EB23]/10 text-[#B8EB23]"
                            : "bg-white/[0.04] text-white/40"
                        }`}
                      >
                        {h.isActive ? "Activo" : "Pausado"}
                      </span>
                      <button
                        onClick={() => handleToggle(h.id)}
                        disabled={isPending}
                        title={h.isActive ? "Pausar" : "Activar"}
                        className="text-white/30 hover:text-white/70 transition-colors disabled:opacity-50"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(h.id)}
                        disabled={isPending}
                        title="Eliminar"
                        className="text-white/30 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {h.events.map((e) => (
                      <span
                        key={e}
                        className="text-[10px] font-mono text-white/40 bg-white/[0.04] px-1.5 py-0.5 rounded"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/30">
                    {h.lastTriggeredAt
                      ? `Último ping ${new Date(h.lastTriggeredAt).toLocaleString("es-CO")}`
                      : "Sin pings aún"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0F0F0F] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Nuevo Webhook</h3>
              <button
                onClick={handleClose}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {secret ? (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-xs text-amber-400 font-medium">
                    Guarda este secret. No podrás verlo de nuevo.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={secret}
                    className="flex-1 text-xs font-mono bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white/80 focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-2.5 rounded-lg bg-white/[0.06] hover:bg-white/10 transition-colors text-white/60"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[#B8EB23]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 text-sm font-semibold bg-[#B8EB23] text-black rounded-xl hover:bg-[#B8EB23]/90 transition-colors"
                >
                  Listo
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">URL del endpoint</label>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://tu-servidor.com/webhook"
                    className="w-full text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-[#B8EB23]/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-2 block">Eventos</label>
                  <div className="space-y-2.5">
                    {SUPPORTED_EVENTS.map((event) => (
                      <label
                        key={event}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event)}
                          onChange={() => toggleEvent(event)}
                          className="w-3.5 h-3.5 accent-[#B8EB23]"
                        />
                        <span className="text-xs font-mono text-white/60 group-hover:text-white/80 transition-colors">
                          {event}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button
                  onClick={handleCreate}
                  disabled={isPending}
                  className="w-full py-2.5 text-sm font-semibold bg-[#B8EB23] text-black rounded-xl hover:bg-[#B8EB23]/90 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Creando..." : "Crear"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
