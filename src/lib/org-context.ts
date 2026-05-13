import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { OrgRole } from "@/types";
import { assertCan, type Permission } from "@/lib/rbac";

/* ──────────────────────────────────────────────────────────────────────
 * Server-side org context.
 *
 * Every multi-tenant page/action calls `requireOrgContext()` to resolve:
 *   { user, organization, membership, role }
 *
 * Resolution order for "which org is active for this user?":
 *   1. user.activeOrgId (column on User) — set when user switches orgs
 *   2. their first OrganizationMember row (creation order)
 *   3. lazy: if user finished onboarding but no org exists yet (legacy
 *      data from FASE 5), provision a personal org from their profile
 *
 * Permission checks compose with `assertCan(role, permission)` from
 * src/lib/rbac.ts — see usage in src/actions/*.ts.
 *
 * NOTE: This file is server-only — it imports from @/lib/db. Never
 * import it from a client component.
 * ────────────────────────────────────────────────────────────────────── */

export type OrgContext = {
  userId: string;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  role: OrgRole;
  permissions: string[];
};

export class OrgContextError extends Error {
  constructor(public readonly code: "unauthenticated" | "no_org" | "forbidden", message: string) {
    super(message);
    this.name = "OrgContextError";
  }
}

/**
 * Ensures the user has at least one organization. If a legacy user from
 * FASE 5 finished onboarding without an org, we provision one for them
 * from their profile so the rest of the app has a tenant to scope by.
 */
async function ensureOrgFor(userId: string): Promise<string | null> {
  const existing = await db.organizationMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: { organizationId: true },
  });
  if (existing) return existing.organizationId;

  // Lazy provision: build slug from OrganizationProfile / CreatorProfile / email.
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      accountType: true,
      onboardingCompleted: true,
      organizationProfile: true,
      creatorProfile: true,
    },
  });
  if (!user || !user.onboardingCompleted) return null;

  const baseName =
    user.organizationProfile?.companyName
    ?? user.creatorProfile?.displayName
    ?? user.name
    ?? user.email.split("@")[0]!;

  const baseSlug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || `org-${userId.slice(0, 6)}`;

  const slug = await findUniqueSlug(baseSlug);
  const orgRole: OrgRole = user.role === "ADMIN" || user.role === "EXECUTIVE" ? "OWNER" : "OWNER";

  const org = await db.organization.create({
    data: {
      name: baseName,
      slug,
      ownerId: user.id,
      logoUrl: user.organizationProfile?.logoUrl ?? user.creatorProfile?.avatarUrl ?? null,
      website: user.organizationProfile?.website ?? user.creatorProfile?.website ?? null,
      industry: user.organizationProfile?.industry ?? user.creatorProfile?.category ?? null,
      size: user.organizationProfile?.companySize ?? null,
      members: {
        create: { userId: user.id, role: orgRole, joinedAt: new Date() },
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
  return org.id;
}

async function findUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (await db.organization.findUnique({ where: { slug }, select: { id: true } })) {
    n += 1;
    slug = `${base}-${n}`;
    if (n > 50) {
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      break;
    }
  }
  return slug;
}

/** Throws OrgContextError if no session or no org is reachable. */
export async function requireOrgContext(): Promise<OrgContext> {
  const user = await getCurrentUser();
  if (!user) throw new OrgContextError("unauthenticated", "Sesión inválida");

  let orgId = user.activeOrgId ?? null;
  if (!orgId) orgId = await ensureOrgFor(user.id);
  if (!orgId) throw new OrgContextError("no_org", "No se pudo resolver la organización activa");

  const membership = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    include: {
      organization: { select: { id: true, slug: true, name: true } },
    },
  });
  if (!membership) throw new OrgContextError("forbidden", "No eres miembro de esta organización");

  if (user.activeOrgId !== orgId) {
    await db.user.update({ where: { id: user.id }, data: { activeOrgId: orgId } }).catch(() => {});
  }
  await db.organizationMember
    .update({ where: { id: membership.id }, data: { lastActiveAt: new Date() } })
    .catch(() => {});

  return {
    userId: user.id,
    organizationId: membership.organizationId,
    organizationSlug: membership.organization.slug,
    organizationName: membership.organization.name,
    role: membership.role,
    permissions: membership.permissions,
  };
}

/** Returns the context or null without throwing — for soft UI checks. */
export async function getOrgContext(): Promise<OrgContext | null> {
  try {
    return await requireOrgContext();
  } catch {
    return null;
  }
}

/** Throws if the active role lacks the required permission. */
export async function requirePermission(permission: Permission): Promise<OrgContext> {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, permission);
  return ctx;
}

/** Returns the list of organizations the user belongs to (for switcher UI). */
export async function listUserOrganizations(userId: string) {
  return db.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        select: { id: true, name: true, slug: true, logoUrl: true, plan: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
}
