"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/actions/audit";

/* ──────────────────────────────────────────────────────────────────────
 * Tenant-scoped screen mutations.
 *
 * Every action verifies the screen belongs to the active organization
 * before mutating, and the actor's OrgRole carries the matching
 * screens:* permission. Audit log captures actor, org, screen, change.
 * ────────────────────────────────────────────────────────────────────── */

async function loadOrgScreen(orgId: string, screenId: string) {
  return db.screen.findFirst({
    where: { id: screenId, organizationId: orgId },
    select: { id: true, status: true, name: true },
  });
}

export async function updateScreenStatus(screenId: string, status: "ONLINE" | "OFFLINE" | "MAINTENANCE") {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "screens:update");

  const screen = await loadOrgScreen(ctx.organizationId, screenId);
  if (!screen) throw new Error("Pantalla no encontrada");

  await db.screen.update({
    where: { id: screenId },
    data: { status, lastPingAt: status === "ONLINE" ? new Date() : undefined },
  });

  await logAudit({
    action: "screen.update",
    entityType: "Screen",
    entityId: screenId,
    metadata: { from: screen.status, to: status },
  });

  revalidatePath("/screens");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function pingScreen(screenId: string) {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "screens:update");

  const screen = await loadOrgScreen(ctx.organizationId, screenId);
  if (!screen) throw new Error("Pantalla no encontrada");

  await db.screen.update({ where: { id: screenId }, data: { lastPingAt: new Date() } });
  revalidatePath("/screens");
  return { success: true };
}

export async function createScreen(data: {
  name: string;
  type: string;
  city: string;
  address: string;
  width: number;
  height: number;
  resolutionWidth?: number;
  resolutionHeight?: number;
  dailyTraffic?: number;
  pricePerSecond?: number;
  orientation?: string;
  notes?: string;
}) {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "screens:create");

  const code = `SCR-${Date.now().toString(36).toUpperCase()}`;

  const screen = await db.screen.create({
    data: {
      name: data.name,
      code,
      organizationId: ctx.organizationId,
      type: data.type as Parameters<typeof db.screen.create>[0]["data"]["type"],
      city: data.city,
      address: data.address,
      width: data.width,
      height: data.height,
      resolutionWidth: data.resolutionWidth ?? 1920,
      resolutionHeight: data.resolutionHeight ?? 1080,
      dailyTraffic: data.dailyTraffic ?? 0,
      pricePerSecond: data.pricePerSecond ?? 0,
      orientation: data.orientation ?? "landscape",
      notes: data.notes,
      status: "ONLINE",
      lastPingAt: new Date(),
    },
  });

  await logAudit({
    action: "screen.create",
    entityType: "Screen",
    entityId: screen.id,
    metadata: { name: data.name, code },
  });

  revalidatePath("/screens");
  revalidatePath("/dashboard");
  return { success: true, id: screen.id };
}

export async function updateScreen(screenId: string, data: {
  name?: string;
  address?: string;
  city?: string;
  dailyTraffic?: number;
  pricePerSecond?: number;
  notes?: string;
  isActive?: boolean;
}) {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "screens:update");

  const screen = await loadOrgScreen(ctx.organizationId, screenId);
  if (!screen) throw new Error("Pantalla no encontrada");

  await db.screen.update({ where: { id: screenId }, data });
  await logAudit({ action: "screen.update", entityType: "Screen", entityId: screenId, metadata: data });
  revalidatePath("/screens");
  return { success: true };
}

export async function deleteScreen(screenId: string) {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "screens:delete");

  const screen = await loadOrgScreen(ctx.organizationId, screenId);
  if (!screen) throw new Error("Pantalla no encontrada");

  await db.screen.delete({ where: { id: screenId } });
  await logAudit({
    action: "screen.delete",
    entityType: "Screen",
    entityId: screenId,
    metadata: { name: screen.name },
  });
  revalidatePath("/screens");
  return { success: true };
}
