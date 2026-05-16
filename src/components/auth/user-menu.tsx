"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, LogOut, User, ChevronDown, Shield, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserIcon } from "@/components/ui/user-icon";

import { useRole } from "@/hooks/use-role";
import type { UserRole } from "@/types";

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ADMIN: {
    label: "Administrador",
    color: "text-[#B8EB23]",
    bg: "bg-[#B8EB23]/10 border-[#B8EB23]/20",
    icon: Shield,
  },
  EXECUTIVE: {
    label: "Ejecutivo",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
    icon: Building2,
  },
  COMPANY: {
    label: "Empresa",
    color: "text-[#B8EB23]",
    bg: "bg-[#B8EB23]/8 border-[#B8EB23]/15",
    icon: Building2,
  },
  CREATOR: {
    label: "Creator",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
    icon: User,
  },
  CLIENT: {
    label: "Cliente",
    color: "text-white/60",
    bg: "bg-white/[0.06] border-white/[0.08]",
    icon: User,
  },
};

export function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const role = useRole() ?? "EXECUTIVE";
  const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG.EXECUTIVE;
  const RoleIcon = roleConfig.icon;

  const displayName = user?.fullName ?? user?.firstName ?? "Usuario";
  const displayEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 p-1 pl-1 pr-2.5 rounded-xl border transition-all",
          open
            ? "bg-white/[0.07] border-white/[0.12]"
            : "bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.07] hover:border-white/[0.12]"
        )}
      >
        <UserIcon size="sm" />
        <div className="hidden md:flex flex-col items-start leading-none">
          <span className="text-[13px] font-medium text-white max-w-[100px] truncate leading-none">{displayName}</span>
          <span className={cn("text-[10px] font-medium mt-0.5", roleConfig.color)}>{roleConfig.label}</span>
        </div>
        <ChevronDown
          className={cn("w-3.5 h-3.5 text-white/30 transition-transform duration-200 hidden md:block", open && "rotate-180")}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-full mt-2 w-64 bg-[#141414] border border-white/[0.09] rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
          >
            {/* Profile header */}
            <div className="px-4 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <UserIcon size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate leading-none">{displayName}</p>
                  <p className="text-[11px] text-white/40 mt-1 truncate">{displayEmail}</p>
                </div>
              </div>

              {/* Role badge */}
              <div className={cn(
                "mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold",
                roleConfig.color, roleConfig.bg
              )}>
                <RoleIcon className="w-3 h-3" />
                {roleConfig.label}
              </div>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <MenuLink href="/settings" icon={<User className="w-4 h-4" />} label="Mi perfil" onClick={() => setOpen(false)} />
              <MenuLink href="/settings" icon={<Settings className="w-4 h-4" />} label="Configuración" onClick={() => setOpen(false)} />
            </div>

            {/* Logout */}
            <div className="p-1.5 border-t border-white/[0.06]">
              <button
                onClick={() => signOut({ redirectUrl: "/sign-in" })}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400/80 hover:text-red-400 hover:bg-red-400/[0.07] transition-all group"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Cerrar sesión</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href, icon, label, onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-all"
    >
      <span className="flex-shrink-0 text-white/40">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
