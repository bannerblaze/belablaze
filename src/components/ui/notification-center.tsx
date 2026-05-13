"use client";

import { useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Info, AlertCircle, CheckCircle2, XCircle, Trash2,
} from "lucide-react";
import { useAppStore } from "@/store";
import { cn, formatRelativeTime } from "@/lib/utils";
import { duration, easing } from "@/lib/motion";
import type { Notification } from "@/types";

function NotifIcon({ type }: { type: Notification["type"] }) {
  if (type === "success") return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
  if (type === "error") return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  if (type === "warning") return <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />;
  return <Info className="w-3.5 h-3.5 text-blue-400" />;
}

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

/** Bucket a notification by relative day: "Hoy" / "Ayer" / "Anteriores". */
function bucketKey(createdAt: string): "today" | "yesterday" | "older" {
  const now = new Date();
  const d = new Date(createdAt);
  const sameDay = now.toDateString() === d.toDateString();
  if (sameDay) return "today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === d.toDateString()) return "yesterday";
  return "older";
}

const BUCKET_LABEL: Record<"today" | "yesterday" | "older", string> = {
  today: "Hoy",
  yesterday: "Ayer",
  older: "Anteriores",
};

export function NotificationCenter({ open, onClose, anchorRef }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllRead,
    dismissNotification,
    dismissAllNotifications,
  } = useAppStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInPanel = panelRef.current?.contains(target);
      const clickedInAnchor = anchorRef.current?.contains(target);
      if (!clickedInPanel && !clickedInAnchor) onClose();
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, anchorRef]);

  // Group notifications by bucket; preserve sort order within each bucket
  const grouped = useMemo(() => {
    const buckets: Record<"today" | "yesterday" | "older", Notification[]> = {
      today: [], yesterday: [], older: [],
    };
    for (const n of notifications) buckets[bucketKey(n.createdAt)].push(n);
    return (["today", "yesterday", "older"] as const).filter((k) => buckets[k].length > 0).map((k) => ({
      key: k,
      label: BUCKET_LABEL[k],
      items: buckets[k],
    }));
  }, [notifications]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label="Centro de notificaciones"
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: duration.fast, ease: easing.spring }}
          className="absolute right-0 top-full mt-2 w-[320px] sm:w-[360px] bg-[#0F0F0F]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.7)] z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Notificaciones</span>
              {unreadCount > 0 && (
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: duration.fast, ease: easing.bounce }}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#B8EB23]/15 text-[#B8EB23] leading-none"
                >
                  {unreadCount}
                </motion.span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] text-white/40 hover:text-[#B8EB23] transition-colors"
                  aria-label="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3 h-3" />
                  Leer todo
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={dismissAllNotifications}
                  className="flex items-center gap-1 text-[11px] text-white/40 hover:text-red-400/80 transition-colors"
                  aria-label="Eliminar todas"
                  title="Eliminar todas"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 rounded-2xl bg-[#B8EB23]/8 blur-2xl" />
                  <div className="relative w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
                    <Bell className="w-5 h-5 text-white/20" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-xs font-medium text-white/40">Sin notificaciones</p>
                <p className="text-[11px] text-white/20 mt-1">Las acciones recientes aparecerán aquí</p>
              </div>
            ) : (
              grouped.map((bucket) => (
                <div key={bucket.key}>
                  <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                    {bucket.label}
                  </p>
                  <AnimatePresence initial={false}>
                    {bucket.items.map((notif) => (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8, height: 0, marginTop: 0, marginBottom: 0 }}
                        transition={{ duration: duration.fast, ease: easing.out }}
                        className={cn(
                          "group flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 transition-colors",
                          notif.read ? "opacity-50 hover:opacity-70" : "hover:bg-white/[0.03]"
                        )}
                      >
                        <button
                          onClick={() => markNotificationRead(notif.id)}
                          className="flex items-start gap-3 flex-1 min-w-0 text-left"
                          aria-label="Marcar como leída"
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                            notif.type === "success" ? "bg-green-400/10" :
                            notif.type === "error" ? "bg-red-400/10" :
                            notif.type === "warning" ? "bg-yellow-400/10" : "bg-blue-400/10"
                          )}>
                            <NotifIcon type={notif.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-white leading-snug">{notif.title}</p>
                              {!notif.read && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-1.5 h-1.5 rounded-full bg-[#B8EB23] flex-shrink-0 mt-1"
                                />
                              )}
                            </div>
                            <p className="text-[11px] text-white/40 mt-0.5 leading-snug">{notif.message}</p>
                            <p className="text-[10px] text-white/25 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => dismissNotification(notif.id)}
                          className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400/80 transition-all flex-shrink-0 mt-0.5"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
