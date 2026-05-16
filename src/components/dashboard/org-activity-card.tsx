import { Activity, ArrowRight, Building2, User } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/* Server component: renders the latest org audit events on the dashboard.
 *
 * Single-owner model: every action is the owner's action. We attribute
 * "personal" events (org.create) to the user and everything else to
 * the organization — gives the feed a calmer "what's happening" tone
 * rather than reading like a per-user audit trail. */

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
    "campaign.create": "lanzó una campaña",
    "campaign.update": "actualizó una campaña",
    "campaign.delete": "eliminó una campaña",
    "campaign.pause": "pausó una campaña",
    "ad.create": "creó un anuncio",
    "ad.update": "actualizó un anuncio",
    "ad.approve": "aprobó un anuncio",
    "ad.reject": "rechazó un anuncio",
    "ad.delete": "eliminó un anuncio",
    "screen.create": "registró una pantalla",
    "screen.update": "actualizó una pantalla",
    "screen.delete": "eliminó una pantalla",
    "client.create": "agregó un cliente",
    "client.update": "actualizó un cliente",
    "client.delete": "eliminó un cliente",
    "media.upload": "subió un archivo",
    "media.delete": "eliminó un archivo",
    "schedule.create": "creó un horario",
    "schedule.update": "actualizó un horario",
  };
  return map[action] ?? action;
}

/* Identity events keep the user as the actor; everything else is
 * attributed to the organization. */
const PERSONAL_ACTIONS = new Set<string>(["org.create"]);

export async function OrgActivityCard() {
  const ctx = await getOrgContext();
  if (!ctx) return null;

  const [items, org] = await Promise.all([
    db.auditLog.findMany({
      where: { organizationId: ctx.organizationId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { name: true, logoUrl: true },
    }),
  ]);

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader title="Actividad de la cuenta" subtitle="Últimos eventos" icon={<Activity className="w-4 h-4" />} />
        <CardContent className="py-6 text-center">
          <p className="text-xs text-white/30">Sin actividad aún</p>
        </CardContent>
      </Card>
    );
  }

  const orgName = org?.name ?? ctx.organizationName;

  return (
    <Card>
      <CardHeader
        title="Actividad de la cuenta"
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
        {items.map((i) => {
          const isPersonalEvent = PERSONAL_ACTIONS.has(i.action);
          const actorName = isPersonalEvent ? (i.user?.name ?? "Sistema") : orgName;

          return (
            <div key={i.id} className="flex items-center gap-2.5 py-1.5">
              <div className="w-7 h-7 rounded-full bg-[#B8EB23]/[0.08] text-[#B8EB23] flex items-center justify-center flex-shrink-0">
                {isPersonalEvent
                  ? <User className="w-3.5 h-3.5" />
                  : <Building2 className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">
                  <strong className="font-semibold">{actorName}</strong>{" "}
                  <span className="text-white/50">{actionLabel(i.action)}</span>
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {timeAgo(i.createdAt)} · {i.entityType}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
