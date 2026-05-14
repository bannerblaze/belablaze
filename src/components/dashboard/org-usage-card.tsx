import Link from "next/link";
import { CreditCard, HardDrive, Users, Layers, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { getOrgPlan } from "@/lib/limits";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PLANS } from "@/lib/plans";

/* Server component: shows quota consumption for the active org —
 * campaigns / screens / members / storage. The "Ver plan" button in the
 * header is a real <Link> with a proper hit area (px-2.5 py-1.5) and
 * keyboard focus styling so it's actually clickable on mobile. */

function Bar({ value, max, label, unit, icon: Icon }: { value: number; max: number; label: string; unit?: string; icon: typeof Layers }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-white/60 font-medium flex items-center gap-1.5">
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <span className="text-[11px] tabular-nums text-white/60">
          <span className="text-white font-semibold">{value.toLocaleString()}{unit ?? ""}</span>
          <span className="text-white/30"> / {max.toLocaleString()}{unit ?? ""}</span>
        </span>
      </div>
      <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 95 ? "bg-red-400" : pct >= 80 ? "bg-amber-400" : "bg-[#B8EB23]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export async function OrgUsageCard() {
  const ctx = await getOrgContext();
  if (!ctx) return null;

  // Use getOrgPlan() — matches the source of truth in src/lib/limits.ts
  // (returns FREE when no subscription row exists, or when CANCELED).
  const [plan, campaigns, screens, members, media] = await Promise.all([
    getOrgPlan(ctx.organizationId),
    db.campaign.count({ where: { organizationId: ctx.organizationId } }),
    db.screen.count({ where: { organizationId: ctx.organizationId } }),
    db.organizationMember.count({ where: { organizationId: ctx.organizationId } }),
    db.mediaAsset.aggregate({
      where: { organizationId: ctx.organizationId, isArchived: false },
      _sum: { size: true },
    }),
  ]);

  const limits = PLANS[plan].limits;
  const storageMB = Math.round(((media._sum.size ?? 0) / 1024 / 1024) * 10) / 10;

  return (
    <Card>
      <CardHeader
        title={`Plan ${PLANS[plan].name}`}
        subtitle="Uso actual de la organización"
        icon={<CreditCard className="w-4 h-4" />}
        action={
          <Link
            href="/settings/billing"
            prefetch
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#B8EB23] bg-[#B8EB23]/[0.06] border border-[#B8EB23]/15 hover:bg-[#B8EB23]/[0.12] hover:border-[#B8EB23]/30 focus:outline-none focus:ring-2 focus:ring-[#B8EB23]/30 transition-all"
          >
            Ver plan
            <ArrowRight className="w-3 h-3" />
          </Link>
        }
      />
      <CardContent className="pt-2 space-y-3">
        <Bar value={campaigns} max={limits.campaigns} label="Campañas" icon={Layers} />
        <Bar value={screens} max={limits.screens} label="Pantallas" icon={Layers} />
        <Bar value={members} max={limits.members} label="Miembros" icon={Users} />
        <Bar value={storageMB} max={limits.storageMB} label="Almacenamiento" unit=" MB" icon={HardDrive} />
      </CardContent>
    </Card>
  );
}
