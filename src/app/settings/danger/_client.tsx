"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { deleteOrganization } from "@/actions/organizations";

interface Props {
  organizationId: string;
  organizationName: string;
  isOwner: boolean;
}

export function DangerClient({ organizationName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState("");

  const onDelete = () => {
    if (confirm !== organizationName) {
      toast.error(`Escribe "${organizationName}" para confirmar.`);
      return;
    }
    startTransition(async () => {
      const res = await deleteOrganization();
      if (res.ok) {
        toast.success("Organización eliminada");
        router.push("/onboarding");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/50">
        Eres el propietario. Eliminar la organización borra <strong className="text-red-300">todos los datos</strong>
        {" "}(campañas, anuncios, pantallas, media). Esta acción no se puede deshacer.
      </p>
      <div>
        <label className="text-xs font-semibold text-white/50 mb-1.5 block">
          Escribe <code className="text-red-300 font-mono">{organizationName}</code> para confirmar
        </label>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-red-400/20 text-sm text-white font-mono focus:outline-none focus:border-red-400/40"
        />
      </div>
      <Button
        onClick={onDelete}
        disabled={pending || confirm !== organizationName}
        icon={<Trash2 className="w-3.5 h-3.5" />}
        className="bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-400/30"
      >
        Eliminar definitivamente
      </Button>
    </div>
  );
}
