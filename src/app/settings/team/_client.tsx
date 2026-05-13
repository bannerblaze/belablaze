"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, MoreVertical, Mail, Trash2, RefreshCw, Crown,
  Copy, Check, X, Clock, Send,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { ORG_ROLE_LABELS } from "@/lib/rbac";
import {
  inviteMember, revokeInvitation, resendInvitation, updateMemberRole, removeMember,
} from "@/actions/invitations";
import type { OrgRole } from "@/types";

type Member = {
  id: string;
  userId: string;
  role: OrgRole;
  joinedAt: string;
  lastActiveAt: string | null;
  email: string;
  name: string;
  avatar: string | null;
};

type Invite = {
  id: string;
  email: string;
  role: OrgRole;
  expiresAt: string;
  createdAt: string;
};

interface Props {
  currentUserId: string;
  currentRole: OrgRole;
  orgName: string;
  members: Member[];
  invitations: Invite[];
}

const ROLE_OPTIONS: OrgRole[] = ["ADMIN", "EXECUTIVE", "MANAGER", "EDITOR", "ANALYST", "VIEWER"];

function RoleBadge({ role }: { role: OrgRole }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-[#B8EB23] bg-[#B8EB23]/[0.08] border border-[#B8EB23]/15">
      {role === "OWNER" && <Crown className="w-2.5 h-2.5" />}
      {ORG_ROLE_LABELS[role]}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "hace unos segundos";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-CO");
}

export function TeamClient({ currentUserId, currentRole, orgName, members, invitations }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const canManage = currentRole === "OWNER" || currentRole === "ADMIN";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Miembros del equipo</h2>
          <p className="text-xs text-white/40 mt-0.5">{members.length} miembros activos en {orgName}</p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteOpen(true)} icon={<UserPlus className="w-3.5 h-3.5" />}>
            Invitar miembro
          </Button>
        )}
      </div>

      {/* Members list */}
      <Card>
        <CardContent className="pt-1 pb-1">
          <div className="divide-y divide-white/[0.04]">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                m={m}
                canManage={canManage && m.role !== "OWNER" && m.userId !== currentUserId}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending invites */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader title="Invitaciones pendientes" subtitle={`${invitations.length} esperando aceptación`} icon={<Mail className="w-4 h-4" />} />
          <CardContent>
            <div className="divide-y divide-white/[0.04]">
              {invitations.map((i) => (
                <InviteRow key={i.id} i={i} canManage={canManage} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
        {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function MemberRow({ m, canManage }: { m: Member; canManage: boolean }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleRole = (role: OrgRole) => {
    startTransition(async () => {
      const res = await updateMemberRole({ memberId: m.id, role });
      if (res.ok) toast.success("Rol actualizado");
      else toast.error(res.error);
      setOpenMenu(false);
    });
  };
  const handleRemove = () => {
    if (!confirm(`¿Remover a ${m.name} del equipo?`)) return;
    startTransition(async () => {
      const res = await removeMember(m.id);
      if (res.ok) toast.success("Miembro removido");
      else toast.error(res.error);
      setOpenMenu(false);
    });
  };

  return (
    <div className="flex items-center gap-3 py-3 px-2">
      <Avatar name={m.name} avatar={m.avatar} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-white truncate">{m.name}</p>
          <RoleBadge role={m.role} />
        </div>
        <p className="text-xs text-white/40 truncate">{m.email}</p>
      </div>
      <div className="hidden sm:block text-right">
        <p className="text-[11px] text-white/30">Se unió</p>
        <p className="text-xs text-white/60">{timeAgo(m.joinedAt)}</p>
      </div>
      {canManage && (
        <div className="relative">
          <button
            onClick={() => setOpenMenu((v) => !v)}
            disabled={pending}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
            aria-label="Acciones"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {openMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 mt-1 z-50 w-44 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl p-1"
                >
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/30">Cambiar rol</p>
                  {ROLE_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRole(r)}
                      className={cn(
                        "w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-white/[0.06] transition-all flex items-center gap-2",
                        m.role === r ? "text-[#B8EB23]" : "text-white/70",
                      )}
                    >
                      {m.role === r && <Check className="w-3 h-3" />}
                      {ORG_ROLE_LABELS[r]}
                    </button>
                  ))}
                  <div className="my-1 h-px bg-white/[0.05]" />
                  <button
                    onClick={handleRemove}
                    className="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-red-400/[0.1] text-red-300 transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover del equipo
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function InviteRow({ i, canManage }: { i: Invite; canManage: boolean }) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    // For local dev: build link from current origin.
    const link = `${window.location.origin}/invite/${i.id}`;
    void navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const onResend = () => {
    startTransition(async () => {
      const res = await resendInvitation(i.id);
      if (res.ok) toast.success("Invitación renovada");
      else toast.error(res.error);
    });
  };

  const onRevoke = () => {
    startTransition(async () => {
      const res = await revokeInvitation(i.id);
      if (res.ok) toast.success("Invitación revocada");
      else toast.error(res.error);
    });
  };

  return (
    <div className="flex items-center gap-3 py-3 px-2">
      <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center text-white/30 flex-shrink-0">
        <Mail className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-white truncate">{i.email}</p>
          <RoleBadge role={i.role} />
        </div>
        <p className="text-[11px] text-white/40 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Expira {timeAgo(i.expiresAt)}
        </p>
      </div>
      <button onClick={copyLink} className="px-2 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-all flex items-center gap-1.5">
        {copied ? <Check className="w-3.5 h-3.5 text-[#B8EB23]" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copiado" : "Copiar link"}
      </button>
      {canManage && (
        <>
          <button onClick={onResend} disabled={pending} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05]" title="Renovar">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRevoke} disabled={pending} className="p-1.5 rounded-lg text-white/40 hover:text-red-300 hover:bg-red-400/[0.06]" title="Revocar">
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10" />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B8EB23] to-[#8FBA10] flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
      {getInitials(name)}
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("EDITOR");
  const [pending, startTransition] = useTransition();
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const submit = () => {
    if (!email.includes("@")) { toast.error("Email inválido"); return; }
    startTransition(async () => {
      const res = await inviteMember({ email, role });
      if (res.ok) {
        const link = `${window.location.origin}/invite/${res.data?.token}`;
        setInviteLink(link);
        toast.success("Invitación creada");
      } else {
        toast.error(res.error);
      }
    });
  };

  const copy = () => {
    if (!inviteLink) return;
    void navigator.clipboard.writeText(inviteLink).then(() => toast.success("Link copiado"));
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="w-full max-w-md rounded-2xl bg-[#111111] border border-white/10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Invitar miembro</h3>
              <p className="text-xs text-white/40 mt-0.5">Comparte el enlace con tu equipo</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05]">
              <X className="w-4 h-4" />
            </button>
          </div>
          {!inviteLink ? (
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1.5 block">Email</label>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="persona@empresa.com"
                  className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#B8EB23]/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1.5 block">Rol</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ROLE_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                        role === r
                          ? "bg-[#B8EB23]/10 text-[#B8EB23] border-[#B8EB23]/30"
                          : "bg-white/[0.02] text-white/60 border-white/[0.06] hover:border-white/[0.12]",
                      )}
                    >
                      {ORG_ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={submit} disabled={pending} icon={<Send className="w-3.5 h-3.5" />} className="w-full">
                {pending ? "Creando…" : "Generar invitación"}
              </Button>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#B8EB23]/10 border border-[#B8EB23]/20 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-5 h-5 text-[#B8EB23]" />
                </div>
                <h4 className="text-sm font-semibold text-white">¡Listo!</h4>
                <p className="text-xs text-white/40 mt-1">Comparte este link con {email}</p>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <code className="text-[11px] text-white/70 flex-1 truncate font-mono">{inviteLink}</code>
                <button onClick={copy} className="px-2 py-1 rounded-md text-[11px] font-semibold text-[#B8EB23] hover:bg-[#B8EB23]/[0.08]">
                  Copiar
                </button>
              </div>
              <Button variant="outline" onClick={onClose} className="w-full">Cerrar</Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
