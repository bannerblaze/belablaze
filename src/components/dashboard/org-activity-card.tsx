import { Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/* Server component: renders the latest org audit events on the dashboard.
 * Renders nothing if no org context is available (legacy users). */

function timeAgo(iso: Date): string {
  const diff = Date.now() - iso.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    "org.create": "creó la organización",
    "org.update": "actualizó la organización",
    "member.invite": "invitó a un miembro",
    "member.accept": "se unió al equipo",
    "member.update_role": "cambió el rol de un miembro",
    "member.remove": "removió a un miembro",
    "campaign.create": "creó una campaña",
    "campaign.update": "actualizó una campaña",
    "ad.approve": "aprobó un anuncio",
    "ad.reject": "rechazó un anuncio",
    "media.upload": "subió un archivo",
    "media.delete": "eliminó un archivo",
    "schedule.create": "creó un horario",
    "billing.update_plan": "cambió el plan",
  };
  return map[action] ?? action;
}

export async function OrgActivityCard() {
  const ctx = await getOrgContext();
  if (!ctx) return null;

  const items = await db.auditLog.findMany({
    where: { organizationId: ctx.organizationId },
    include: { user: { select: { name: true, avatar: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader title="Actividad del equipo" subtitle="Últimos eventos" icon={<Activity className="w-4 h-4" />} />
        <CardContent className="py-6 text-center">
          <p className="text-xs text-white/30">Sin actividad aún</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Actividad del equipo"
        subtitle="Últimos eventos en la organización"
        icon={<Activity className="w-4 h-4" />}
        action={
          <Link href="/settings/activity" className="text-[11px] text-[#B8EB23] font-semibold hover:underline flex items-center gap-1">
            Ver todo
            <ArrowRight className="w-3 h-3" />
          </Link>
        }
      />
      <CardContent className="pt-2 space-y-1.5">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-2.5 py-1.5">
            <div className="w-7 h-7 rounded-full bg-[#B8EB23]/[0.08] text-[#B8EB23] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {i.user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">
                <strong className="font-semibold">{i.user?.name ?? "Sistema"}</strong>{" "}
                <span className="text-white/50">{actionLabel(i.action)}</span>
              </p>
              <p className="text-[10px] text-white/30 mt-0.5">{timeAgo(i.createdAt)} · {i.entityType}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
