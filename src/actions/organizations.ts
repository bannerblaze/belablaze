"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireOrgContext, listUserOrganizations } from "@/lib/org-context";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/actions/audit";

/* ──────────────────────────────────────────────────────────────────────
 * Organization server actions.
 *
 * createOrganization()       owner = caller, OWNER membership, default
 *                            workspace, trialing subscription
 * updateOrganization()       partial update of brand/profile fields
 * switchOrganization()       sets User.activeOrgId after membership check
 * leaveOrganization()        removes membership (except OWNER)
 * deleteOrganization()       cascades via Prisma onDelete (OWNER only)
 *
 * All mutating actions revalidate the layout cache so the sidebar + org
 * switcher reflect the change immediately.
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
      members: {
        create: { userId: user.id, role: "OWNER", joinedAt: new Date() },
      },
      workspaces: {
        create: { name: "Producción", type: "PRODUCTION" },
      },
      subscription: {
        create: {
          plan: "STARTER",
          status: "TRIALING",
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 3600 * 1000),
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
  assertCan(ctx.role, "org:update");

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

  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
    select: { id: true },
  });
  if (!membership) return { ok: false, error: "No eres miembro de esa organización." };

  await db.user.update({ where: { id: user.id }, data: { activeOrgId: organizationId } });
  await logAudit({ action: "org.switch", entityType: "Organization", entityId: organizationId });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function leaveOrganization(organizationId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesión inválida." };

  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!membership) return { ok: false, error: "No eres miembro." };
  if (membership.role === "OWNER") {
    return { ok: false, error: "El propietario no puede abandonar su organización. Transfiere la propiedad primero." };
  }

  await db.organizationMember.delete({ where: { id: membership.id } });
  if (user.activeOrgId === organizationId) {
    const next = await db.organizationMember.findFirst({ where: { userId: user.id }, orderBy: { joinedAt: "asc" } });
    await db.user.update({ where: { id: user.id }, data: { activeOrgId: next?.organizationId ?? null } });
  }
  await logAudit({ action: "member.leave", entityType: "Organization", entityId: organizationId });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteOrganization(): Promise<Result> {
  const ctx = await requireOrgContext();
  if (ctx.role !== "OWNER") return { ok: false, error: "Sólo el propietario puede eliminar la organización." };

  await db.organization.delete({ where: { id: ctx.organizationId } });
  const user = await getCurrentUser();
  if (user) {
    const next = await db.organizationMember.findFirst({ where: { userId: user.id }, orderBy: { joinedAt: "asc" } });
    await db.user.update({ where: { id: user.id }, data: { activeOrgId: next?.organizationId ?? null } });
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
