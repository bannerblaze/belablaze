"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { updateOrganization } from "@/actions/organizations";

interface Props {
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
  website: string | null;
  industry: string | null;
  canEdit: boolean;
}

const PRESET_COLORS = ["#B8EB23", "#3B82F6", "#A78BFA", "#F472B6", "#F59E0B", "#10B981", "#EF4444", "#06B6D4"];

export function BrandingClient({ name, logoUrl, brandColor, website, industry, canEdit }: Props) {
  const [nameValue, setNameValue] = useState(name);
  const [logo, setLogo] = useState(logoUrl ?? "");
  const [color, setColor] = useState(brandColor ?? "#B8EB23");
  const [siteValue, setSite] = useState(website ?? "");
  const [industryValue, setIndustry] = useState(industry ?? "");
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await updateOrganization({
        name: nameValue,
        logoUrl: logo,
        brandColor: color,
        website: siteValue,
        industry: industryValue,
      });
      if (res.ok) toast.success("Branding actualizado");
      else toast.error(res.error);
    });
  };

  return (
    <Card>
      <CardHeader title="Identidad visual" subtitle="Logo, color principal y datos de la organización" />
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ borderColor: color, boxShadow: `0 0 32px ${color}30` }}
            className="w-20 h-20 rounded-2xl border-2 flex items-center justify-center bg-[#0A0A0A] flex-shrink-0 overflow-hidden"
            style={{ borderColor: color }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={nameValue} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold" style={{ color }}>{nameValue.charAt(0).toUpperCase()}</span>
            )}
          </motion.div>
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold text-white/50">URL del logo</label>
            <input
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              disabled={!canEdit}
              placeholder="https://..."
              className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#B8EB23]/40 disabled:opacity-50"
            />
            <p className="text-[10px] text-white/30">Próximamente: subir desde tu librería /media</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-white/50 mb-1.5 block">Nombre comercial</label>
          <input
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            disabled={!canEdit}
            className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#B8EB23]/40 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-white/50 mb-1.5 block">Color principal</label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                disabled={!canEdit}
                className="w-9 h-9 rounded-lg border-2 transition-all"
                style={{
                  background: c,
                  borderColor: color === c ? "#fff" : "transparent",
                  boxShadow: color === c ? `0 0 16px ${c}` : undefined,
                }}
                aria-label={`Color ${c}`}
              />
            ))}
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={!canEdit}
              className="ml-2 w-28 h-9 px-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-[#B8EB23]/40 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-white/50 mb-1.5 block">Sitio web</label>
            <input
              type="url"
              value={siteValue}
              onChange={(e) => setSite(e.target.value)}
              disabled={!canEdit}
              placeholder="https://tuempresa.com"
              className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#B8EB23]/40 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 mb-1.5 block">Industria</label>
            <input
              type="text"
              value={industryValue}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={!canEdit}
              placeholder="Retail, Tech, Salud…"
              className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#B8EB23]/40 disabled:opacity-50"
            />
          </div>
        </div>

        {canEdit && (
          <div className="pt-3 border-t border-white/[0.05]">
            <Button onClick={save} disabled={pending} icon={<Save className="w-3.5 h-3.5" />}>
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
