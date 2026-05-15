"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { acceptInvitation } from "@/actions/invitations";
import { ORG_ROLE_LABELS } from "@/lib/rbac";
import type { OrgRole, InvitationStatus } from "@/types";

interface Props {
  token: string;
  email: string;
  role: OrgRole;
  status: InvitationStatus;
  expiresAt: string;
  organizationName: string;
  organizationLogo: string | null;
  userEmail: string;
}

export function InviteClient(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isExpired = new Date(props.expiresAt) < new Date();
  const isPending = props.status === "PENDING" && !isExpired;
  const emailMatches = props.email.toLowerCase() === props.userEmail.toLowerCase();

  const accept = () => {
    startTransition(async () => {
      const res = await acceptInvitation(props.token);
      if (res.ok) {
        toast.success(`Bienvenido a ${props.organizationName}`);
        router.replace("/dashboard");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-8 shadow-2xl shadow-black/60">
          <div className="flex justify-center mb-5">
            {props.organizationLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={props.organizationLogo} alt="" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#B8EB23]/20" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B8EB23] to-[#8FBA10] flex items-center justify-center">
                <Building2 className="w-7 h-7 text-black" strokeWidth={2.5} />
              </div>
            )}
          </div>

          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[#B8EB23] mb-2">Invitación</p>
            <h1 className="text-xl font-bold text-white">Únete a {props.organizationName}</h1>
            <p className="text-sm text-white/40 mt-1">
              Te invitaron como <strong className="text-white/80">{ORG_ROLE_LABELS[props.role]}</strong>
            </p>
          </div>

          {!emailMatches && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-amber-400/[0.06] border border-amber-400/20 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                Esta invitación fue enviada a <strong>{props.email}</strong>, pero iniciaste sesión como <strong>{props.userEmail}</strong>.
                Cierra sesión y vuelve a iniciar con la cuenta correcta.
              </div>
            </div>
          )}

          {isExpired && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-red-400/[0.06] border border-red-400/20 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Esta invitación expiró. Pide al equipo que te envíen una nueva.
            </div>
          )}

          {props.status !== "PENDING" && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Esta invitación ya fue procesada (estado: {props.status}).
            </div>
          )}

          {isPending && emailMatches && (
            <Button onClick={accept} disabled={pending} icon={<ArrowRight className="w-4 h-4" />} className="w-full">
              {pending ? "Procesando…" : "Aceptar y entrar"}
            </Button>
          )}

          <p className="text-center text-[11px] text-white/30 mt-5 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3 h-3" />
            BannerBlaze · Plataforma DOOH segura
          </p>
        </div>
      </motion.div>
    </div>
  );
}
