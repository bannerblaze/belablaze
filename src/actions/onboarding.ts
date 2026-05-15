"use server";

import { z } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdminWhitelisted } from "@/config/admin-whitelist";
import { checkAdminRateLimit } from "@/lib/rate-limit";
import { sendAdminAlert } from "@/lib/security-alerts";
import type { OrgRole } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Onboarding -> Organization bootstrap.
 *
 * Every successful onboarding completion atomically provisions an
 * Organization + OrganizationMember (OWNER) + default Workspace +
 * trialing Subscription. The user becomes the org owner and their
 * activeOrgId is set so every subsequent request resolves to that
 * tenant via `requireOrgContext()`.
 * ────────────────────────────────────────────────────────────────────── */

async function uniqueOrgSlug(base: string): Promise<string> {
  let s = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "org";
  const original = s;
  let n = 1;
  while (await db.organization.findUnique({ where: { slug: s }, select: { id: true } })) {
    n += 1;
    s = `${original}-${n}`;
    if (n > 100) { s = `${original}-${Math.random().toString(36).slice(2, 6)}`; break; }
  }
  return s;
}

async function bootstrapOrganization(input: {
  userId: string;
  name: string;
  ownerRole?: OrgRole;
  logoUrl?: string | null;
  website?: string | null;
  industry?: string | null;
  size?: string | null;
}): Promise<{ id: string; slug: string }> {
  const slug = await uniqueOrgSlug(input.name);
  // The Prisma schema still carries `plan` columns from the legacy
  // tier system; we let the schema-level @default fill them. They are
  // not read by any application code anymore.
  const org = await db.organization.create({
    data: {
      name: input.name,
      slug,
      ownerId: input.userId,
      logoUrl: input.logoUrl ?? null,
      website: input.website ?? null,
      industry: input.industry ?? null,
      size: input.size ?? null,
      members: {
        create: { userId: input.userId, role: input.ownerRole ?? "OWNER" },
      },
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
  await db.user.update({ where: { id: input.userId }, data: { activeOrgId: org.id } });
  return { id: org.id, slug: org.slug };
}

/**
 * Syncs the resolved role back into Clerk publicMetadata so the client-side
 * `useRole()` hook (sidebar, user-menu) reflects the correct role immediately
 * after onboarding without waiting for a webhook. Swallows errors so that a
 * Clerk API failure never blocks onboarding completion.
 */
async function syncRoleToClerk(role: string): Promise<void> {
  try {
    const { userId } = await auth();
    if (!userId) return;
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });
  } catch (err) {
    console.error("[onboarding] failed to sync role to Clerk metadata:", err);
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * Onboarding server actions
 *
 * All four actions return a discriminated union `{ ok: true; ... }` /
 * `{ ok: false; error: string; code?: ... }` so the client wizards can
 * branch on outcomes without try/catch noise.
 * ────────────────────────────────────────────────────────────────────── */

type ActionResult =
  | { ok: true }
  | { ok: false; error: string; code?: "rate_limited" | "not_whitelisted" | "wrong_code" | "unauth" };

async function getRequestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null,
    userAgent: h.get("user-agent") ?? null,
  };
}

/* ─── Company onboarding ─────────────────────────────────────────────── */

const companySchema = z.object({
  companyName: z.string().min(2, "Mínimo 2 caracteres"),
  nit: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  website: z.string().optional(),
  country: z.string().min(2, "Selecciona un país"),
  city: z.string().optional(),
  logoUrl: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
});

export type CompanyOnboardingInput = z.infer<typeof companySchema>;

export async function completeCompanyOnboarding(input: CompanyOnboardingInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión.", code: "unauth" };

  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const data = parsed.data;

  await db.$transaction([
    db.organizationProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: { ...data },
    }),
    db.user.update({
      where: { id: user.id },
      data: {
        role: "COMPANY",
        accountType: "ORGANIZATION",
        onboardingCompleted: true,
      },
    }),
    db.log.create({
      data: { userId: user.id, action: "CREATE", entity: "OrganizationProfile", entityId: user.id },
    }),
  ]);

  // Bootstrap the multi-tenant Organization that owns campaigns/screens/etc.
  await bootstrapOrganization({
    userId: user.id,
    name: data.companyName,
    ownerRole: "OWNER",
    logoUrl: data.logoUrl ?? null,
    website: data.website ?? null,
    industry: data.industry ?? null,
    size: data.companySize ?? null,
  });

  await syncRoleToClerk("COMPANY");
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ─── Creator onboarding ─────────────────────────────────────────────── */

const creatorSchema = z.object({
  displayName: z.string().min(2, "Mínimo 2 caracteres"),
  category: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  website: z.string().optional(),
  avatarUrl: z.string().optional(),
  country: z.string().min(2, "Selecciona un país"),
  city: z.string().optional(),
});

export type CreatorOnboardingInput = z.infer<typeof creatorSchema>;

export async function completeCreatorOnboarding(input: CreatorOnboardingInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión.", code: "unauth" };

  const parsed = creatorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const data = parsed.data;

  await db.$transaction([
    db.creatorProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: { ...data },
    }),
    db.user.update({
      where: { id: user.id },
      data: {
        role: "CREATOR",
        accountType: "PERSON",
        onboardingCompleted: true,
      },
    }),
    db.log.create({
      data: { userId: user.id, action: "CREATE", entity: "CreatorProfile", entityId: user.id },
    }),
  ]);

  await bootstrapOrganization({
    userId: user.id,
    name: data.displayName,
    ownerRole: "OWNER",
    logoUrl: data.avatarUrl ?? null,
    website: data.website ?? null,
    industry: data.category ?? null,
  });

  await syncRoleToClerk("CREATOR");
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ─── Admin verification & onboarding ────────────────────────────────── */

const adminAccessSchema = z.object({
  email: z.string().email("Email inválido"),
  code: z.string().min(1, "Ingresa el código"),
});

export type AdminAccessInput = z.infer<typeof adminAccessSchema>;

export type AdminVerifyResult =
  | { ok: true }
  | { ok: false; error: string; code: "rate_limited" | "not_whitelisted" | "wrong_code" | "no_config" | "unauth" };

/**
 * Validates email whitelist + rate limit + access code.
 * Persists every attempt to SecurityLog and emits sendAdminAlert.
 * Does NOT mutate the User row — see completeAdminOnboarding for that.
 */
export async function verifyAdminAccess(input: AdminAccessInput): Promise<AdminVerifyResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesión expirada.", code: "unauth" };

  const parsed = adminAccessSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos.", code: "wrong_code" };
  }
  const { email, code } = parsed.data;
  const meta = await getRequestMeta();

  await sendAdminAlert("ADMIN_SIGNUP_ATTEMPT", {
    email,
    ip: meta.ip,
    userAgent: meta.userAgent,
    metadata: { clerkId: user.clerkId },
  }, false);

  // 1. Rate limit (counts ADMIN_CODE_FAILED in last 15min)
  const rl = await checkAdminRateLimit(email);
  if (rl.blocked) {
    await sendAdminAlert("ADMIN_RATE_LIMITED", { email, ip: meta.ip, userAgent: meta.userAgent }, false);
    return {
      ok: false,
      error: `Demasiados intentos. Vuelve a intentarlo después de ${rl.resetAt.toLocaleTimeString()}.`,
      code: "rate_limited",
    };
  }

  // 2. Whitelist
  if (!isAdminWhitelisted(email)) {
    await sendAdminAlert("ADMIN_CODE_FAILED", {
      email, ip: meta.ip, userAgent: meta.userAgent,
      metadata: { reason: "not_whitelisted" },
    }, false);
    return { ok: false, error: "Este correo no está autorizado para crear cuentas administrativas.", code: "not_whitelisted" };
  }

  // 3. Access code env var
  const expected = process.env.ADMIN_ACCESS_CODE;
  if (!expected) {
    return { ok: false, error: "El sistema admin no está configurado. Contacta al equipo.", code: "no_config" };
  }
  if (code !== expected) {
    await sendAdminAlert("ADMIN_CODE_FAILED", {
      email, ip: meta.ip, userAgent: meta.userAgent,
      metadata: { reason: "wrong_code" },
    }, false);
    return { ok: false, error: "Código de acceso incorrecto.", code: "wrong_code" };
  }

  return { ok: true };
}

const adminOnboardingSchema = z.object({
  email: z.string().email(),
  code: z.string().min(1),
  name: z.string().min(2),
  position: z.string().optional(),
});

export type AdminOnboardingInput = z.infer<typeof adminOnboardingSchema>;

export async function completeAdminOnboarding(input: AdminOnboardingInput): Promise<ActionResult> {
  const parsed = adminOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  // Re-verify before mutating — defense in depth.
  const verify = await verifyAdminAccess({ email: parsed.data.email, code: parsed.data.code });
  if (!verify.ok) {
    return { ok: false, error: verify.error, code: verify.code === "unauth" ? "unauth" : "wrong_code" };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesión expirada.", code: "unauth" };

  const meta = await getRequestMeta();

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        role: "ADMIN",
        accountType: "INTERNAL",
        onboardingCompleted: true,
        name: parsed.data.name,
        position: parsed.data.position ?? null,
      },
    }),
    db.log.create({
      data: { userId: user.id, action: "CREATE", entity: "AdminUser", entityId: user.id },
    }),
  ]);

  await sendAdminAlert("ADMIN_ACCESS_GRANTED", {
    email: parsed.data.email,
    ip: meta.ip,
    userAgent: meta.userAgent,
    metadata: { clerkId: user.clerkId, name: parsed.data.name },
  }, true);

  // Admins join the BannerBlaze master org if it exists; otherwise we
  // create one so they have a tenant to operate in.
  const masterOrg = await db.organization.findUnique({ where: { slug: "bannerblaze" } });
  if (masterOrg) {
    await db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: masterOrg.id, userId: user.id } },
      create: { organizationId: masterOrg.id, userId: user.id, role: "ADMIN" },
      update: { role: "ADMIN" },
    });
    await db.user.update({ where: { id: user.id }, data: { activeOrgId: masterOrg.id } });
  } else {
    await bootstrapOrganization({
      userId: user.id,
      name: "BannerBlaze",
      ownerRole: "OWNER",
    });
  }

  await syncRoleToClerk("ADMIN");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Helper that pages use to bail early if the user already completed onboarding. */
export async function isOnboardingComplete(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user?.onboardingCompleted;
}
