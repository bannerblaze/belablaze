"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Plus, X } from "lucide-react";
import { createApiKey, revokeApiKey } from "@/actions/api-keys";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const SCOPES = [
  "read:campaigns",
  "write:campaigns",
  "read:ads",
  "write:ads",
  "read:analytics",
  "read:screens",
];

type SerializedApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export function ApiKeysClient({ keys }: { keys: SerializedApiKey[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleScope(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  function handleGenerate() {
    if (!name.trim()) {
      setError("El nombre es requerido");
      return;
    }
    if (!selectedScopes.length) {
      setError("Selecciona al menos un scope");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createApiKey(name.trim(), selectedScopes);
      setRawKey(result.rawKey);
      router.refresh();
    });
  }

  function handleClose() {
    setShowModal(false);
    setName("");
    setSelectedScopes([]);
    setRawKey(null);
    setError(null);
    setCopied(false);
  }

  function handleCopy() {
    if (!rawKey) return;
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRevoke(id: string) {
    if (!confirm("¿Revocar esta API key? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      await revokeApiKey(id);
      router.refresh();
    });
  }

  const activeCount = keys.filter((k) => !k.revokedAt).length;

  return (
    <>
      <Card>
        <CardHeader
          title={`${activeCount} ${activeCount === 1 ? "clave activa" : "claves activas"}`}
          subtitle="Las claves se muestran sólo al momento de crear — guárdalas en un lugar seguro"
          action={
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-black bg-[#B8EB23] hover:bg-[#B8EB23]/90 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              Nueva API Key
            </button>
          }
        />
        <CardContent className="py-3">
          {keys.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-white/40">Aún no has generado claves API</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {keys.map((k) => (
                <div key={k.id} className="flex items-start gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{k.name}</p>
                    <p className="text-xs text-white/40 font-mono mt-0.5">
                      {k.keyPrefix}••••••••
                    </p>
                    {k.scopes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] text-white/40 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 mt-0.5">
                    <span className="text-[11px] text-white/30">
                      {k.lastUsedAt
                        ? `Usado ${new Date(k.lastUsedAt).toLocaleDateString("es-CO")}`
                        : "Nunca usado"}
                    </span>
                    {k.revokedAt ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400">
                        Revocada
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        disabled={isPending}
                        className="text-[11px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      >
                        Revocar
                      </button>
                    )}
                  </div>
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
              <h3 className="text-sm font-semibold text-white">Nueva API Key</h3>
              <button
                onClick={handleClose}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {rawKey ? (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-xs text-amber-400 font-medium">
                    Guarda esta clave ahora. No podrás verla de nuevo.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={rawKey}
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
                  <label className="text-xs text-white/50 mb-1.5 block">Nombre</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Integración CRM"
                    className="w-full text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-[#B8EB23]/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-2 block">
                    Permisos (scopes)
                  </label>
                  <div className="space-y-2.5">
                    {SCOPES.map((scope) => (
                      <label
                        key={scope}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope)}
                          onChange={() => toggleScope(scope)}
                          className="w-3.5 h-3.5 accent-[#B8EB23]"
                        />
                        <span className="text-xs font-mono text-white/60 group-hover:text-white/80 transition-colors">
                          {scope}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button
                  onClick={handleGenerate}
                  disabled={isPending}
                  className="w-full py-2.5 text-sm font-semibold bg-[#B8EB23] text-black rounded-xl hover:bg-[#B8EB23]/90 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Generando..." : "Generar"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
