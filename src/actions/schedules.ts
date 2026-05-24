"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { logAudit } from "@/actions/audit";
import type { ScheduleStatus } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Campaign scheduling engine.
 *
 * A `CampaignSchedule` row defines WHEN a campaign should run within
 * its lifecycle (overall startDate/endDate, time-of-day window, day-of-
 * week mask, timezone, priority).
 *
 * Conflict detection runs at create-time: if two schedules of the same
 * priority overlap on the same days+hours within the same date range,
 * the new one is created with status=CONFLICT for human review.
 * ────────────────────────────────────────────────────────────────────── */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const scheduleSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(2),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  timezone: z.string().default("America/Bogota"),
  activeDays: z.array(z.number().min(0).max(6)).min(1, "Selecciona al menos un día"),
  startHour: z.number().min(0).max(23),
  endHour: z.number().min(1).max(24),
  priority: z.number().min(1).max(10).default(5),
  notes: z.string().optional(),
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
function hoursOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}
function daysOverlap(a: number[], b: number[]): boolean {
  return a.some((d) => b.includes(d));
}

async function detectConflict(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  activeDays: number[],
  startHour: number,
  endHour: number,
  priority: number,
  excludeId?: string,
): Promise<boolean> {
  const candidates = await db.campaignSchedule.findMany({
    where: {
      organizationId,
      status: { in: ["SCHEDULED", "ACTIVE"] },
      priority,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true, startDate: true, endDate: true, activeDays: true, startHour: true, endHour: true },
  });

  return candidates.some((c) =>
    rangesOverlap(startDate, endDate, c.startDate, c.endDate)
    && hoursOverlap(startHour, endHour, c.startHour, c.endHour)
    && daysOverlap(activeDays, c.activeDays)
  );
}

export async function createSchedule(input: ScheduleInput): Promise<Result<{ id: string; status: ScheduleStatus }>> {
  const ctx = await requireOrgContext();

  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  if (parsed.data.endHour <= parsed.data.startHour) return { ok: false, error: "La hora final debe ser mayor a la inicial." };

  const startDate = new Date(parsed.data.startDate);
  const endDate = new Date(parsed.data.endDate);
  if (endDate <= startDate) return { ok: false, error: "La fecha final debe ser posterior." };

  const conflict = await detectConflict(
    ctx.organizationId, startDate, endDate, parsed.data.activeDays,
    parsed.data.startHour, parsed.data.endHour, parsed.data.priority,
  );

  const schedule = await db.campaignSchedule.create({
    data: {
      organizationId: ctx.organizationId,
      campaignId: parsed.data.campaignId,
      name: parsed.data.name,
      startDate,
      endDate,
      timezone: parsed.data.timezone,
      activeDays: parsed.data.activeDays,
      startHour: parsed.data.startHour,
      endHour: parsed.data.endHour,
      priority: parsed.data.priority,
      notes: parsed.data.notes ?? null,
      status: conflict ? "CONFLICT" : "SCHEDULED",
    },
  });

  await logAudit({
    action: "schedule.create",
    entityType: "CampaignSchedule",
    entityId: schedule.id,
    metadata: { name: schedule.name, conflict },
  });
  revalidatePath("/campaigns/calendar");
  return { ok: true, data: { id: schedule.id, status: schedule.status } };
}

export async function updateScheduleStatus(scheduleId: string, status: ScheduleStatus): Promise<Result> {
  const ctx = await requireOrgContext();

  const schedule = await db.campaignSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || schedule.organizationId !== ctx.organizationId) return { ok: false, error: "Schedule no encontrado." };

  await db.campaignSchedule.update({ where: { id: scheduleId }, data: { status } });
  await logAudit({ action: "schedule.update", entityType: "CampaignSchedule", entityId: scheduleId, metadata: { status } });
  revalidatePath("/campaigns/calendar");
  return { ok: true };
}

export async function deleteSchedule(scheduleId: string): Promise<Result> {
  const ctx = await requireOrgContext();

  const schedule = await db.campaignSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || schedule.organizationId !== ctx.organizationId) return { ok: false, error: "Schedule no encontrado." };

  await db.campaignSchedule.delete({ where: { id: scheduleId } });
  await logAudit({ action: "schedule.delete", entityType: "CampaignSchedule", entityId: scheduleId });
  revalidatePath("/campaigns/calendar");
  return { ok: true };
}

export async function listSchedules() {
  const ctx = await requireOrgContext();
  return db.campaignSchedule.findMany({
    where: { organizationId: ctx.organizationId },
    include: {
      campaign: { select: { id: true, name: true, status: true, client: { select: { name: true } } } },
    },
    orderBy: { startDate: "asc" },
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * AdSchedule CRUD — time-based slot scheduling for a specific ad on
 * a specific screen (AdSchedule model, not CampaignSchedule).
 * ────────────────────────────────────────────────────────────────────── */

export async function createAdSchedule(input: {
  adId: string;
  screenId: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  frequency?: number;
}): Promise<Result> {
  await requireOrgContext();

  if (input.startTime >= input.endTime) {
    return { ok: false, error: "La hora de inicio debe ser anterior a la hora de fin" };
  }
  if (!input.daysOfWeek.length) {
    return { ok: false, error: "Selecciona al menos un día" };
  }

  await db.adSchedule.create({
    data: {
      adId:       input.adId,
      screenId:   input.screenId,
      startTime:  input.startTime,
      endTime:    input.endTime,
      daysOfWeek: input.daysOfWeek,
      frequency:  input.frequency ?? 1,
      isActive:   true,
    },
  });

  revalidatePath(`/screens/${input.screenId}`);
  return { ok: true };
}

export async function toggleAdSchedule(id: string, screenId: string): Promise<Result> {
  await requireOrgContext();

  const schedule = await db.adSchedule.findUnique({ where: { id } });
  if (!schedule) return { ok: false, error: "Schedule no encontrado" };

  await db.adSchedule.update({
    where: { id },
    data: { isActive: !schedule.isActive },
  });

  revalidatePath(`/screens/${screenId}`);
  return { ok: true };
}

export async function deleteAdSchedule(id: string, screenId: string): Promise<Result> {
  await requireOrgContext();

  await db.adSchedule.delete({ where: { id } });

  revalidatePath(`/screens/${screenId}`);
  return { ok: true };
}
