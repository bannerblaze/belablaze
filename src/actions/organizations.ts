"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireOrgContext } from "@/lib/org-context";
import { logAudit } from "@/actions/audit";

/* ──────────────────────────────────────────────────────────────────────
 * Organization server actions — single-org-per-user model.
 *
 * The user's organization is auto-provisioned during onboarding (see
 * src/actions/onboarding.ts bootstrapOrganization). After that, the
 * only operations available on an org are:
 *
 *   • updateOrganization()  partial brand/profile edit
 *   • deleteOrganization()  hard delete (danger zone)
 *
 * createOrganization() and switchOrganization() are gone — there is no
 * multi-org surface anymore. Every authenticated user resolves to
 * their single org via requireOrgContext().
 * ────────────────────────────────────────────────────────────────────── */

type Result<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

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

export async function deleteOrganization(): Promise<Result> {
  const ctx = await requireOrgContext();
  await db.organization.delete({ where: { id: ctx.organizationId } });

  const user = await getCurrentUser();
  if (user) {
    await db.user.update({ where: { id: user.id }, data: { activeOrgId: null } });
  }
  await logAudit({ action: "org.delete", entityType: "Organization", entityId: ctx.organizationId });
  revalidatePath("/", "layout");
  return { ok: true };
}
