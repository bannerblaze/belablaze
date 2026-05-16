"use client";

import { motion } from "framer-motion";
import {
  UserCheck, Mail, Layers, Image as ImageIcon,
  MapPin, Clock, ChevronRight,
} from "lucide-react";
import { UserStatusBadge } from "./user-status-badge";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";
import { staggerChild } from "@/lib/motion";
import type { AdminCreatorUser } from "@/services/admin/users.service";

interface Props {
  rows: AdminCreatorUser[];
}

export function CreatorUsersTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-[#0F0F0F] border border-white/[0.06] py-14 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-400/10 text-violet-400 mb-3">
          <UserCheck className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-white">Sin creadores registrados</p>
        <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">
          Cuando una persona complete onboarding como creador aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#0F0F0F] border border-white/[0.06] overflow-hidden">
      <div className="hidden lg:grid grid-cols-12 items-center gap-3 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02] text-[10px] font-bold uppercase tracking-[0.08em] text-white/30">
        <div className="col-span-4">Creador</div>
        <div className="col-span-2">Ubicación</div>
        <div className="col-span-1 text-right tabular-nums">Camp.</div>
        <div className="col-span-1 text-right tabular-nums">Ads</div>
        <div className="col-span-1 text-right tabular-nums">Media</div>
        <div className="col-span-3 text-right">Estado</div>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {rows.map((r, i) => (
          <motion.div
            key={r.userId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={staggerChild(i)}
            className={cn(
              "grid grid-cols-1 lg:grid-cols-12 items-center gap-3 px-5 py-4 transition-colors group",
              "hover:bg-white/[0.025] cursor-pointer",
            )}
          >
            {/* Identity */}
            <div className="lg:col-span-4 flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-violet-400/10 ring-1 ring-violet-400/15 flex items-center justify-center text-violet-400 flex-shrink-0 group-hover:bg-violet-400/15 transition-colors">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                  {r.displayName}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/35">
                  <span className="inline-flex items-center gap-1 truncate">
                    <Mail className="w-2.5 h-2.5" />
                    {r.email}
                  </span>
                  {r.category && (
                    <>
                      <span>·</span>
                      <span className="truncate">{r.category}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="lg:col-span-2 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-white/70 min-w-0">
                <MapPin className="w-3 h-3 text-white/30 flex-shrink-0" />
                <span className="truncate">{r.city ?? r.country}</span>
              </div>
              {r.city && (
                <p className="text-[10px] text-white/35 mt-0.5 truncate">{r.country}</p>
              )}
            </div>

            <div className="lg:col-span-1 flex items-center gap-1.5 lg:justify-end text-xs text-white tabular-nums">
              <Layers className="w-3 h-3 text-white/30 lg:hidden" />
              <span className="font-semibold">{r.campaignCount}</span>
              <span className="text-[9px] text-white/30 uppercase tracking-wider lg:hidden">camp.</span>
            </div>
            <div className="lg:col-span-1 flex items-center gap-1.5 lg:justify-end text-xs text-white/70 tabular-nums">
              <span className="font-semibold">{r.adCount}</span>
              <span className="text-[9px] text-white/30 uppercase tracking-wider lg:hidden">ads</span>
            </div>
            <div className="lg:col-span-1 flex items-center gap-1.5 lg:justify-end text-xs text-white/70 tabular-nums">
              <ImageIcon className="w-3 h-3 text-white/30 lg:hidden" />
              <span className="font-semibold">{formatNumber(r.mediaCount, true)}</span>
            </div>

            {/* Status */}
            <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-2">
              <div className="flex flex-col items-end gap-1">
                <UserStatusBadge status={r.status} />
                <span className="text-[10px] text-white/30 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {r.lastLoginAt
                    ? <>Activo {formatRelativeTime(r.lastLoginAt)}</>
                    : <>Registrado {formatRelativeTime(r.createdAt)}</>}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all hidden lg:block" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
