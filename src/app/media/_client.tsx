"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon, Video, FileText, Music,
  UploadCloud, Search, Grid3x3, Trash2, X, Loader2, CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { deleteMedia } from "@/actions/media";
import { ACCEPTED_MIME } from "@/lib/storage-constants";
import type { MediaType } from "@/types";

type Asset = {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string | null;
  size: number;
  mimeType: string;
  createdAt: string;
  uploadedBy: { name: string; avatar: string | null };
};

interface Props {
  canUpload: boolean;
  canDelete: boolean;
  stats: { count: number; totalBytes: number };
  assets: Asset[];
}

const TYPE_FILTERS: Array<{ key: "ALL" | MediaType; label: string; icon: typeof ImageIcon }> = [
  { key: "ALL", label: "Todos", icon: Grid3x3 },
  { key: "IMAGE", label: "Imágenes", icon: ImageIcon },
  { key: "VIDEO", label: "Videos", icon: Video },
  { key: "DOCUMENT", label: "Documentos", icon: FileText },
  { key: "AUDIO", label: "Audio", icon: Music },
];

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

type UploadingItem = { id: string; name: string; progress: number; done: boolean; error?: string };

export function MediaClient({ canUpload, canDelete, stats, assets }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"ALL" | MediaType>("ALL");
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadingItem[]>([]);
  const [preview, setPreview] = useState<Asset | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = assets.filter((a) => {
    if (filter !== "ALL" && a.type !== filter) return false;
    if (query && !a.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const queue: UploadingItem[] = arr.map((f, i) => ({
      id: `up-${Date.now()}-${i}`,
      name: f.name,
      progress: 0,
      done: false,
    }));
    setUploads((u) => [...u, ...queue]);

    for (let i = 0; i < arr.length; i++) {
      const f = arr[i]!;
      const id = queue[i]!.id;
      try {
        const fd = new FormData();
        fd.append("file", f);
        const xhr = new XMLHttpRequest();
        await new Promise<void>((resolve, reject) => {
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 100);
              setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: pct } : u)));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(xhr.responseText || `Error ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error("network"));
          xhr.open("POST", "/api/media/upload");
          xhr.send(fd);
        });
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: 100, done: true } : u)));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error";
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, error: msg } : u)));
        toast.error(`No se pudo subir ${f.name}: ${msg}`);
      }
    }
    router.refresh();
    // Clear completed after 2.5s
    setTimeout(() => {
      setUploads((prev) => prev.filter((u) => !u.done || u.error));
    }, 2500);
  }, [router]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!canUpload) { toast.error("Tu rol no permite subir media."); return; }
    if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
  };

  const onPick = () => inputRef.current?.click();

  const onDelete = (id: string) => {
    if (!confirm("¿Eliminar este archivo definitivamente?")) return;
    startTransition(async () => {
      const res = await deleteMedia(id);
      if (res.ok) { toast.success("Archivo eliminado"); router.refresh(); }
      else toast.error(res.error);
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Media library</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {stats.count.toLocaleString()} archivos · {fmtBytes(stats.totalBytes)} usados
          </p>
        </div>
        {canUpload && (
          <Button onClick={onPick} icon={<UploadCloud className="w-3.5 h-3.5" />}>
            Subir archivos
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_MIME.join(",")}
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Dropzone (always visible when canUpload) */}
      {canUpload && (
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          animate={{
            scale: dragging ? 1.01 : 1,
            borderColor: dragging ? "rgba(184,235,35,0.5)" : "rgba(255,255,255,0.08)",
            background: dragging ? "rgba(184,235,35,0.04)" : "rgba(255,255,255,0.02)",
          }}
          className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer"
          onClick={onPick}
        >
          <UploadCloud className="w-8 h-8 text-white/30 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">Arrastra archivos o haz clic para subir</p>
          <p className="text-xs text-white/40 mt-1">PNG, JPG, WebP, GIF, MP4, WebM, MOV, PDF · hasta 100 MB por archivo</p>
        </motion.div>
      )}

      {/* Active uploads */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-1.5"
          >
            {uploads.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {u.error ? (
                  <X className="w-4 h-4 text-red-400" />
                ) : u.done ? (
                  <CheckCircle2 className="w-4 h-4 text-[#B8EB23]" />
                ) : (
                  <Loader2 className="w-4 h-4 text-[#B8EB23] animate-spin" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate font-medium">{u.name}</p>
                  <div className="h-1 mt-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${u.progress}%` }}
                      transition={{ duration: 0.2 }}
                      className={cn("h-full rounded-full", u.error ? "bg-red-400" : "bg-[#B8EB23]")}
                    />
                  </div>
                </div>
                <span className="text-[11px] text-white/40 tabular-nums">{u.progress}%</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter + search */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          {TYPE_FILTERS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                  filter === t.key ? "bg-[#B8EB23]/10 text-[#B8EB23]" : "text-white/40 hover:text-white",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full h-10 pl-11 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/[0.12]"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ImageIcon className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/40">No hay archivos {filter !== "ALL" ? `de tipo ${filter.toLowerCase()}` : ""}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              whileHover={{ y: -2 }}
              className="relative group rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden cursor-pointer hover:border-white/[0.12] transition-all"
              onClick={() => setPreview(a)}
            >
              <div className="aspect-square bg-black/40 relative">
                {a.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                ) : a.type === "VIDEO" ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-white/30" />
                  </div>
                ) : a.type === "AUDIO" ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-8 h-8 text-white/30" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-white/30" />
                  </div>
                )}
                {canDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(a.id); }}
                    disabled={pending}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur text-white/70 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs text-white truncate font-medium">{a.name}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{fmtBytes(a.size)} · {a.type}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl w-full rounded-2xl bg-[#111111] border border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-black flex items-center justify-center p-2 min-h-[280px]">
                {preview.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.url} alt={preview.name} className="max-h-[60vh] max-w-full object-contain" />
                ) : preview.type === "VIDEO" ? (
                  <video src={preview.url} controls className="max-h-[60vh] max-w-full" />
                ) : (
                  <a href={preview.url} target="_blank" rel="noreferrer" className="text-[#B8EB23] underline">
                    Abrir archivo
                  </a>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{preview.name}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{fmtBytes(preview.size)} · {preview.mimeType}</p>
                </div>
                <button onClick={() => setPreview(null)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
