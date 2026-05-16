import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/* ──────────────────────────────────────────────────────────────────────
 * Server-side org context.
 *
 * BelaBlaze runs on a single-owner model: 1 user = 1 organization.
 * There are no members, no invitations, no roles inside an org —
 * if you can reach the org you ARE the org. Per-org permissions
 * collapse to "is this user the owner of this org?", which is true
 * by construction for every authenticated session.
 *
 * Resolution order for "which org is active for this user?":
 *   1. user.activeOrgId column (set after onboarding / org switch)
 *   2. Organization where ownerId = user.id (creation order)
 *   3. lazy: if the user finished onboarding but has no org yet,
 *      auto-provision a personal org from their profile
 *
 * NOTE: server-only — never import from a client component.
 * ────────────────────────────────────────────────────────────────────── */

export type OrgContext = {
  userId: string;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
};

export class OrgContextError extends Error {
  constructor(public readonly code: "unauthenticated" | "no_org", message: string) {
    super(message);
    this.name = "OrgContextError";
  }
}

/** Returns the user's org id, lazy-provisioning one if they finished
 *  onboarding without an org (legacy data path). */
async function resolveOrCreateOrgFor(userId: string): Promise<string | null> {
  const existing = await db.organization.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existing) return existing.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
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

  const org = await db.organization.create({
    data: {
      name: baseName,
      slug,
      ownerId: user.id,
      logoUrl: user.organizationProfile?.logoUrl ?? user.creatorProfile?.avatarUrl ?? null,
      website: user.organizationProfile?.website ?? user.creatorProfile?.website ?? null,
      industry: user.organizationProfile?.industry ?? user.creatorProfile?.category ?? null,
      size: user.organizationProfile?.companySize ?? null,
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
  if (!orgId) orgId = await resolveOrCreateOrgFor(user.id);
  if (!orgId) throw new OrgContextError("no_org", "No se pudo resolver la organización activa");

  const org = await db.organization.findFirst({
    where: { id: orgId, ownerId: user.id },
    select: { id: true, slug: true, name: true },
  });

  if (!org) {
    // The cached activeOrgId points at an org the user no longer owns.
    const fresh = await resolveOrCreateOrgFor(user.id);
    if (!fresh) throw new OrgContextError("no_org", "No se pudo resolver la organización");
    const refetched = await db.organization.findUnique({
      where: { id: fresh },
      select: { id: true, slug: true, name: true },
    });
    if (!refetched) throw new OrgContextError("no_org", "Organización no encontrada");
    await db.user.update({ where: { id: user.id }, data: { activeOrgId: fresh } }).catch(() => {});
    return {
      userId: user.id,
      organizationId: refetched.id,
      organizationSlug: refetched.slug,
      organizationName: refetched.name,
    };
  }

  if (user.activeOrgId !== orgId) {
    await db.user.update({ where: { id: user.id }, data: { activeOrgId: orgId } }).catch(() => {});
  }

  return {
    userId: user.id,
    organizationId: org.id,
    organizationSlug: org.slug,
    organizationName: org.name,
  };
}

/** Soft variant — returns null instead of throwing. */
export async function getOrgContext(): Promise<OrgContext | null> {
  try {
    return await requireOrgContext();
  } catch {
    return null;
  }
}

/** Returns every org owned by this user. Single-owner model, so
 *  typically 0 or 1 — but ORGANIZATION/INTERNAL accounts may spin
 *  up multiple parallel orgs. */
export async function listUserOrganizations(userId: string) {
  return db.organization.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, logoUrl: true },
  });
}
