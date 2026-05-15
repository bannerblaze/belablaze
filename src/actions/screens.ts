"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { requirePlatformStaff } from "@/lib/access";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/actions/audit";

/* ──────────────────────────────────────────────────────────────────────
 * Screen mutations — INTERNAL-only.
 *
 * Pantallas DOOH is a BannerBlaze-internal operations panel. Every
 * action runs three checks in this exact order:
 *
 *   1. requirePlatformStaff()  — caller must be SUPER_ADMIN or SUPPORT.
 *      ORGANIZATION/PERSON accounts get an AccessError before any DB
 *      access; their session token is irrelevant.
 *   2. requireOrgContext()     — resolves the staff member's tenant so
 *      the row stays scoped. (BannerBlaze internal users still have an
 *      org for telemetry/audit purposes.)
 *   3. assertCan(role, perm)   — OrgRole must carry the matching
 *      screens:* permission inside that internal org.
 *
 * Audit log captures actor, org, screen and change — these are the
 * actions that move physical hardware state, so the trail matters.
 * ────────────────────────────────────────────────────────────────────── */

async function loadOrgScreen(orgId: string, screenId: string) {
  return db.screen.findFirst({
    where: { id: screenId, organizationId: orgId },
    select: { id: true, status: true, name: true },
  });
}

export async function updateScreenStatus(screenId: string, status: "ONLINE" | "OFFLINE" | "MAINTENANCE") {
  await requirePlatformStaff();
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
  await requirePlatformStaff();
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
  await requirePlatformStaff();
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
  await requirePlatformStaff();
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
  await requirePlatformStaff();
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
