"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2, Hash, Briefcase, Globe, MapPin, Phone, User, Edit3,
  Image as ImageIcon, Sparkles, AtSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AccountType } from "@/types";

export type OrgProfileView = {
  companyName: string;
  nit: string | null;
  industry: string | null;
  companySize: string | null;
  website: string | null;
  logoUrl: string | null;
  country: string;
  city: string | null;
  contactName: string | null;
  contactPhone: string | null;
} | null;

export type CreatorProfileView = {
  displayName: string;
  category: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  website: string | null;
  avatarUrl: string | null;
  country: string;
  city: string | null;
} | null;

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-white/30 flex-shrink-0">{icon}</span>
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <span className="text-xs font-medium text-white text-right truncate max-w-[55%]">{value || "—"}</span>
    </div>
  );
}

export function AccountProfileCard({
  accountType,
  organization,
  creator,
}: {
  accountType: AccountType | null;
  organization: OrgProfileView;
  creator: CreatorProfileView;
}) {
  if (accountType === "ORGANIZATION" && organization) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#B8EB23]/15 text-[#B8EB23] flex items-center justify-center">
                  {organization.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={organization.logoUrl} alt={organization.companyName} className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <Building2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{organization.companyName}</p>
                  <Badge variant="brand" size="sm" className="mt-1">Empresa</Badge>
                </div>
              </div>
              <Link
                href="#"
                onClick={(e) => e.preventDefault()}
                title="Edición disponible en próxima versión"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white border border-white/[0.06] hover:border-white/15 transition-all"
              >
                <Edit3 className="w-3 h-3" />
                Editar
              </Link>
            </div>

            <div className="border-t border-white/[0.06] pt-3">
              <Row icon={<Hash className="w-3.5 h-3.5" />} label="NIT" value={organization.nit} />
              <Row icon={<Briefcase className="w-3.5 h-3.5" />} label="Industria" value={organization.industry} />
              <Row icon={<Sparkles className="w-3.5 h-3.5" />} label="Tamaño" value={organization.companySize ? `${organization.companySize} empleados` : null} />
              <Row icon={<Globe className="w-3.5 h-3.5" />} label="Sitio web" value={organization.website} />
              <Row icon={<MapPin className="w-3.5 h-3.5" />} label="Ubicación" value={[organization.city, organization.country].filter(Boolean).join(", ")} />
              <Row icon={<User className="w-3.5 h-3.5" />} label="Contacto" value={organization.contactName} />
              <Row icon={<Phone className="w-3.5 h-3.5" />} label="Teléfono" value={organization.contactPhone} />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (accountType === "PERSON" && creator) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-400/15 text-purple-400 flex items-center justify-center overflow-hidden">
                  {creator.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{creator.displayName}</p>
                  <Badge variant="default" size="sm" className="mt-1 bg-purple-400/10 text-purple-400 border-purple-400/20">Creator</Badge>
                </div>
              </div>
              <Link
                href="#"
                onClick={(e) => e.preventDefault()}
                title="Edición disponible en próxima versión"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white border border-white/[0.06] hover:border-white/15 transition-all"
              >
                <Edit3 className="w-3 h-3" />
                Editar
              </Link>
            </div>

            <div className="border-t border-white/[0.06] pt-3">
              <Row icon={<Hash className="w-3.5 h-3.5" />} label="Categoría" value={creator.category} />
              <Row icon={<AtSign className="w-3.5 h-3.5" />} label="Instagram" value={creator.instagram} />
              <Row icon={<Sparkles className="w-3.5 h-3.5" />} label="TikTok" value={creator.tiktok} />
              <Row icon={<ImageIcon className="w-3.5 h-3.5" />} label="YouTube" value={creator.youtube} />
              <Row icon={<Globe className="w-3.5 h-3.5" />} label="Web" value={creator.website} />
              <Row icon={<MapPin className="w-3.5 h-3.5" />} label="Ubicación" value={[creator.city, creator.country].filter(Boolean).join(", ")} />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // INTERNAL or unknown
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#B8EB23]/15 text-[#B8EB23] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Cuenta interna BannerBlaze</p>
              <p className="text-xs text-white/40 mt-0.5">Acceso administrativo · sin perfil de empresa/creator</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
