import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { db } from "@/lib/db";
import { listSchedules } from "@/actions/schedules";
import { CalendarClient } from "./_client";

export default async function CalendarPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const [schedules, campaigns] = await Promise.all([
    listSchedules(),
    db.campaign.findMany({
      where: { organizationId: ctx.organizationId },
      select: { id: true, name: true, status: true, client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <CalendarClient
      canManage={true}
      schedules={schedules.map((s) => ({
        id: s.id,
        name: s.name,
        campaignId: s.campaignId,
        campaignName: s.campaign.name,
        clientName: s.campaign.client?.name ?? null,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        activeDays: s.activeDays,
        startHour: s.startHour,
        endHour: s.endHour,
        priority: s.priority,
        status: s.status,
        notes: s.notes,
      }))}
      campaigns={campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        clientName: c.client?.name ?? null,
      }))}
    />
  );
}
