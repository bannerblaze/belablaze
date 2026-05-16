"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireOrgContext, listUserOrganizations } from "@/lib/org-context";
import { logAudit } from "@/actions/audit";

/* ──────────────────────────────────────────────────────────────────────
 * Organization server actions — single-owner model.
 *
 * createOrganization()  caller becomes the sole owner, default
 *                       workspace and trialing subscription created.
 *                       No member rows: ownerId on Organization is the
 *                       authoritative "who's in this org" answer.
 * updateOrganization()  partial brand/profile update.
 * switchOrganization()  sets User.activeOrgId after verifying the
 *                       target org is owned by the caller.
 * deleteOrganization()  cascades via Prisma onDelete.
 *
 * leaveOrganization() is gone — there are no non-owner members to leave.
 * ────────────────────────────────────────────────────────────────────── */

type Result<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const createSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones").optional(),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().optional(),
  size: z.string().optional(),
});

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}

async function uniqueSlug(base: string): Promise<string> {
  let s = base;
  let n = 1;
  while (await db.organization.findUnique({ where: { slug: s }, select: { id: true } })) {
    n += 1;
    s = `${base}-${n}`;
    if (n > 100) { s = `${base}-${Math.random().toString(36).slice(2, 6)}`; break; }
  }
  return s;
}

export async function createOrganization(input: z.infer<typeof createSchema>): Promise<Result<{ id: string; slug: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesión inválida." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const slugBase = parsed.data.slug ?? slugify(parsed.data.name);
  const slug = await uniqueSlug(slugBase);

  const org = await db.organization.create({
    data: {
      name: parsed.data.name,
      slug,
      ownerId: user.id,
      website: parsed.data.website || null,
      industry: parsed.data.industry || null,
      size: parsed.data.size || null,
      workspaces: {
        create: { name: "Producción", type: "PRODUCTION" },
      },
      subscription: {
        create: {
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 3600 * 1000),
        },
      },
    },
  });

  await db.user.update({ where: { id: user.id }, data: { activeOrgId: org.id } });
  await logAudit({ action: "org.create", entityType: "Organization", entityId: org.id, metadata: { name: org.name } });
  revalidatePath("/", "layout");
  return { ok: true, data: { id: org.id, slug: org.slug } };
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().optional(),
  size: z.string().optional(),
  logoUrl: z.string().optional(),
  brandColor: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional(),
});

export async function updateOrganization(input: z.infer<typeof updateSchema>): Promise<Result> {
  const ctx = await requireOrgContext();

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  await db.organization.update({
    where: { id: ctx.organizationId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.website !== undefined && { website: parsed.data.website || null }),
      ...(parsed.data.industry !== undefined && { industry: parsed.data.industry || null }),
      ...(parsed.data.size !== undefined && { size: parsed.data.size || null }),
      ...(parsed.data.logoUrl !== undefined && { logoUrl: parsed.data.logoUrl || null }),
      ...(parsed.data.brandColor !== undefined && {
        brandColor: parsed.data.brandColor.startsWith("#") ? parsed.data.brandColor : `#${parsed.data.brandColor}`,
      }),
    },
  });

  await logAudit({ action: "org.update", entityType: "Organization", entityId: ctx.organizationId, metadata: parsed.data });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function switchOrganization(organizationId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesión inválida." };

  const owns = await db.organization.findFirst({
    where: { id: organizationId, ownerId: user.id },
    select: { id: true },
  });
  if (!owns) return { ok: false, error: "No eres propietario de esa organización." };

  await db.user.update({ where: { id: user.id }, data: { activeOrgId: organizationId } });
  await logAudit({ action: "org.switch", entityType: "Organization", entityId: organizationId });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteOrganization(): Promise<Result> {
  const ctx = await requireOrgContext();
  await db.organization.delete({ where: { id: ctx.organizationId } });

  const user = await getCurrentUser();
  if (user) {
    const next = await db.organization.findFirst({
      where: { ownerId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    await db.user.update({ where: { id: user.id }, data: { activeOrgId: next?.id ?? null } });
  }
  await logAudit({ action: "org.delete", entityType: "Organization", entityId: ctx.organizationId });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getMyOrganizations() {
  const user = await getCurrentUser();
  if (!user) return [];
  return listUserOrganizations(user.id);
}
