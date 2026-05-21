"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { logAudit } from "@/actions/audit";
import { createScreen as repoCreate } from "@/server/repositories/screens.repository";
import type { ScreenType } from "@prisma/client";

/* ──────────────────────────────────────────────────────────────────────
 * createScreen — dedicated server action for the DOOH screen form.
 *
 * Validates input, resolves org context, generates identifiers, writes
 * to DB, and audits. Returns { success, id } or throws on error.
 * ────────────────────────────────────────────────────────────────────── */

const VALID_TYPES: ScreenType[] = ["LED_INDOOR", "LED_OUTDOOR", "LCD", "PROJECTION", "INTERACTIVE"];

const schema = z.object({
  name:             z.string().min(3, "Nombre mínimo 3 caracteres"),
  type:             z.string().min(1, "Tipo requerido"),
  city:             z.string().min(2, "Ciudad requerida"),
  address:          z.string().min(5, "Dirección requerida"),
  width:            z.number().positive("Ancho requerido"),
  height:           z.number().positive("Alto requerido"),
  resolutionWidth:  z.number().int().positive().optional(),
  resolutionHeight: z.number().int().positive().optional(),
  dailyTraffic:     z.number().int().min(0).optional(),
  pricePerSecond:   z.number().min(0).optional(),
  orientation:      z.enum(["landscape", "portrait"]).optional(),
  notes:            z.string().max(500).optional(),
  latitude:         z.number().optional(),
  longitude:        z.number().optional(),
});

function buildSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base}-${Date.now().toString(36)}`;
}

export async function createScreen(input: z.infer<typeof schema>) {
  const ctx = await requireOrgContext();

  const validated = schema.safeParse(input);
  if (!validated.success) {
    const first = validated.error.issues[0];
    throw new Error(first?.message ?? "Datos inválidos");
  }

  const data = validated.data;

  const resolvedType: ScreenType = VALID_TYPES.includes(data.type as ScreenType)
    ? (data.type as ScreenType)
    : "LED_OUTDOOR";

  const slug = buildSlug(data.name);
  const code = `SCR-${Date.now().toString(36).toUpperCase()}`;

  const screen = await repoCreate({
    organizationId:   ctx.organizationId,
    name:             data.name,
    slug,
    code,
    type:             resolvedType,
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
    metadata:   { name: screen.name, code, slug, city: screen.city },
  });

  revalidatePath("/screens");
  revalidatePath("/dashboard");

  return { success: true as const, id: screen.id, code, slug };
}
