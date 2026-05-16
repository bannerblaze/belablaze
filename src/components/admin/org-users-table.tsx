"use client";

import { motion } from "framer-motion";
import {
  Building2, Mail, Layers, MonitorPlay, HardDrive,
  Clock, ChevronRight,
} from "lucide-react";
import { UserStatusBadge } from "./user-status-badge";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";
import { staggerChild } from "@/lib/motion";
import type { AdminOrgUser } from "@/services/admin/users.service";

/* Premium row-based listing for organization users. Each row is a
 * dense card with company identity, owner contact, status, key
 * counts (campaigns / ads / screens / storage) and timing info.
 *
 * Click → in a future iteration this can route to /clients/[orgId]
 * for a drill-down. For now it's pure read-only enterprise admin. */

interface Props {
  rows: AdminOrgUser[];
}

export function OrgUsersTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-[#0F0F0F] border border-white/[0.06] py-14 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#B8EB23]/10 text-[#B8EB23] mb-3">
          <Building2 className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-white">Sin empresas registradas</p>
        <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">
          Cuando una organización complete onboarding aparecerá listada aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#0F0F0F] border border-white/[0.06] overflow-hidden">
      {/* Header — desktop only */}
      <div className="hidden lg:grid grid-cols-12 items-center gap-3 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02] text-[10px] font-bold uppercase tracking-[0.08em] text-white/30">
        <div className="col-span-4">Empresa</div>
        <div className="col-span-2">Contacto</div>
        <div className="col-span-1 text-right tabular-nums">Camp.</div>
        <div className="col-span-1 text-right tabular-nums">Ads</div>
        <div className="col-span-1 text-right tabular-nums">Pant.</div>
        <div className="col-span-1 text-right tabular-nums">MB</div>
        <div className="col-span-2 text-right">Estado</div>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {rows.map((r, i) => (
          <motion.div
            key={r.orgId}
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
              <div className="w-9 h-9 rounded-xl bg-[#B8EB23]/10 ring-1 ring-[#B8EB23]/15 flex items-center justify-center text-[#B8EB23] flex-shrink-0 group-hover:bg-[#B8EB23]/15 transition-colors">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate group-hover:text-[#B8EB23] transition-colors">
                  {r.orgName}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/35">
                  <span className="font-mono">/{r.slug}</span>
                  {r.industry && (
                    <>
                      <span>·</span>
                      <span className="truncate">{r.industry}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Owner contact */}
            <div className="lg:col-span-2 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-white/70 min-w-0">
                <Mail className="w-3 h-3 text-white/30 flex-shrink-0" />
                <span className="truncate">{r.ownerEmail}</span>
              </div>
              <p className="text-[10px] text-white/35 mt-0.5 truncate">{r.ownerName}</p>
            </div>

            {/* Metrics — mobile shows them in a single row, desktop spread */}
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
              <MonitorPlay className="w-3 h-3 text-white/30 lg:hidden" />
              <span className="font-semibold">{r.screenCount}</span>
              <span className="text-[9px] text-white/30 uppercase tracking-wider lg:hidden">pant.</span>
            </div>
            <div className="lg:col-span-1 flex items-center gap-1.5 lg:justify-end text-xs text-white/70 tabular-nums">
              <HardDrive className="w-3 h-3 text-white/30 lg:hidden" />
              <span className="font-semibold">{formatNumber(r.storageMB, true)}</span>
              <span className="text-[9px] text-white/30 uppercase tracking-wider">MB</span>
            </div>

            {/* Status + meta */}
            <div className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-2">
              <div className="flex flex-col items-end gap-1">
                <UserStatusBadge status={r.status} />
                <span className="text-[10px] text-white/30 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {r.lastLoginAt
                    ? <>Activa {formatRelativeTime(r.lastLoginAt)}</>
                    : <>Registrada {formatRelativeTime(r.createdAt)}</>}
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
