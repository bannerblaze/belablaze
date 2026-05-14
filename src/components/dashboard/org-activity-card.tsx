import { Activity, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/* Server component: renders the latest org audit events on the dashboard.
 *
 * Attribution rule:
 *   - Org-level actions (campaigns, ads, screens, clients, media, billing,
 *     schedules) are headlined as "{Org} <verb>" — the dashboard reads as
 *     a feed of what the org is doing, not a per-user audit trail.
 *   - Member-level actions (invite/join/role-change/remove + initial
 *     org.create) keep the individual user as the actor, since those
 *     events are inherently about a person.
 *
 * The full per-user audit log lives at /settings/activity. */

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
    "billing.update_plan": "cambió el plan",
  };
  return map[action] ?? action;
}

/* Member-scoped actions keep the user as the actor. Everything else is
 * attributed to the organization. */
const MEMBER_ACTIONS = new Set<string>([
  "member.invite",
  "member.accept",
  "member.update_role",
  "member.remove",
  "member.leave",
  "org.create",
]);

export async function OrgActivityCard() {
  const ctx = await getOrgContext();
  if (!ctx) return null;

  const [items, org] = await Promise.all([
    db.auditLog.findMany({
      where: { organizationId: ctx.organizationId },
      include: { user: { select: { name: true, avatar: true, email: true } } },
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
        <CardHeader title="Actividad del equipo" subtitle="Últimos eventos" icon={<Activity className="w-4 h-4" />} />
        <CardContent className="py-6 text-center">
          <p className="text-xs text-white/30">Sin actividad aún</p>
        </CardContent>
      </Card>
    );
  }

  const orgName = org?.name ?? ctx.organizationName;
  const orgInitial = orgName.charAt(0).toUpperCase();

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
        {items.map((i) => {
          const isMemberEvent = MEMBER_ACTIONS.has(i.action);
          const actorName = isMemberEvent ? (i.user?.name ?? "Sistema") : orgName;
          const actorInitial = isMemberEvent
            ? (i.user?.name?.charAt(0).toUpperCase() ?? "?")
            : orgInitial;
          const showByline = !isMemberEvent && i.user?.name;

          return (
            <div key={i.id} className="flex items-center gap-2.5 py-1.5">
              <div className="w-7 h-7 rounded-full bg-[#B8EB23]/[0.08] text-[#B8EB23] flex items-center justify-center text-[10px] font-bold flex-shrink-0 overflow-hidden">
                {!isMemberEvent && org?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={org.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : !isMemberEvent ? (
                  <Building2 className="w-3.5 h-3.5" />
                ) : (
                  actorInitial
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">
                  <strong className="font-semibold">{actorName}</strong>{" "}
                  <span className="text-white/50">{actionLabel(i.action)}</span>
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {timeAgo(i.createdAt)} · {i.entityType}
                  {showByline && <> · por {i.user!.name}</>}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
