"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { logAudit } from "@/actions/audit";
import {
  createScreen as repoCreate,
  updateScreen as repoUpdate,
  deleteScreen as repoDelete,
  getScreenById as repoGetById,
} from "@/server/repositories/screens.repository";

/* ──────────────────────────────────────────────────────────────────────
 * Screen mutations — org-scoped.
 *
 * All actions resolve the caller's org context via requireOrgContext().
 * The single-owner model means every authenticated user IS the owner
 * of their org, so "can this user do X?" is always true once the
 * context resolves. Audit log captures actor + org + entity.
 * ────────────────────────────────────────────────────────────────────── */

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base}-${Date.now().toString(36)}`;
}

async function loadOrgScreen(orgId: string, screenId: string) {
  return repoGetById(screenId, orgId);
}

export async function createScreen(data: {
  name: string;
  type?: string;
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
  latitude?: number;
  longitude?: number;
}) {
  const ctx = await requireOrgContext();

  const code = `SCR-${Date.now().toString(36).toUpperCase()}`;
  const slug = generateSlug(data.name);

  const screen = await repoCreate({
    organizationId:   ctx.organizationId,
    name:             data.name,
    slug,
    code,
    type:             (data.type ?? "LED_OUTDOOR") as import("@prisma/client").ScreenType,
    city:             data.city,
    address:          data.address,
    width:            data.width,
    height:           data.height,
    resolutionWidth:  data.resolutionWidth,
    resolutionHeight: data.resolutionHeight,
    dailyTraffic:     data.dailyTraffic,
    pricePerSecond:   data.pricePerSecond,
    orientation:      data.orientation,
    notes:            data.notes,
    latitude:         data.latitude,
    longitude:        data.longitude,
  });

  await logAudit({
    action:     "screen.create",
    entityType: "Screen",
    entityId:   screen.id,
    metadata:   { name: data.name, code, slug },
  });

  revalidatePath("/screens");
  revalidatePath("/dashboard");
  return { success: true, id: screen.id };
}

export async function updateScreenStatus(screenId: string, status: "ONLINE" | "OFFLINE" | "MAINTENANCE") {
  const ctx = await requireOrgContext();

  const screen = await loadOrgScreen(ctx.organizationId, screenId);
  if (!screen) throw new Error("Pantalla no encontrada");

  await repoUpdate(screenId, ctx.organizationId, {
    status,
    lastPingAt: status === "ONLINE" ? new Date() : undefined,
  });

  await logAudit({
    action:     "screen.update",
    entityType: "Screen",
    entityId:   screenId,
    metadata:   { from: screen.status, to: status },
  });

  revalidatePath("/screens");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function pingScreen(screenId: string) {
  const ctx = await requireOrgContext();

  const screen = await loadOrgScreen(ctx.organizationId, screenId);
  if (!screen) throw new Error("Pantalla no encontrada");

  await repoUpdate(screenId, ctx.organizationId, { lastPingAt: new Date() });
  revalidatePath("/screens");
  return { success: true };
}

export async function updateScreen(
  screenId: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    dailyTraffic?: number;
    pricePerSecond?: number;
    notes?: string;
    isActive?: boolean;
  },
) {
  const ctx = await requireOrgContext();

  const screen = await loadOrgScreen(ctx.organizationId, screenId);
  if (!screen) throw new Error("Pantalla no encontrada");

  await repoUpdate(screenId, ctx.organizationId, data);
  await logAudit({ action: "screen.update", entityType: "Screen", entityId: screenId, metadata: data });
  revalidatePath("/screens");
  return { success: true };
}

export async function deleteScreen(screenId: string) {
  const ctx = await requireOrgContext();

  const screen = await loadOrgScreen(ctx.organizationId, screenId);
  if (!screen) throw new Error("Pantalla no encontrada");

  await repoDelete(screenId, ctx.organizationId);
  await logAudit({
    action:     "screen.delete",
    entityType: "Screen",
    entityId:   screenId,
    metadata:   { name: screen.name },
  });
  revalidatePath("/screens");
  return { success: true };
}
