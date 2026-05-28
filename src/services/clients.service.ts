import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { FilterOptions } from "@/types";
import { getOrgContext } from "@/lib/org-context";

async function uniqueClientSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || `client-${Date.now().toString(36)}`;
  let candidate = base;
  let n = 1;
  while (await db.client.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    n++;
    candidate = `${base}-${n}`;
    if (n > 50) { candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`; break; }
  }
  return candidate;
}

/**
 * For COMPANY/CREATOR accounts: find or create the "self-client" that
 * represents their own business. Stores the id in user.companyId so
 * subsequent calls are instant (fast path). Returns null on failure.
 */
export async function getOrCreateSelfClient(): Promise<string | null> {
  const ctx = await getOrgContext();
  if (!ctx) return null;

  const user = await db.user.findUnique({
    where: { id: ctx.userId },
    include: { organizationProfile: true },
  });
  if (!user) return null;

  if (user.companyId) return user.companyId;

  const existing = await db.client.findFirst({
    where: { organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (existing) {
    await db.user.update({ where: { id: ctx.userId }, data: { companyId: existing.id } });
    return existing.id;
  }

  const profile = user.organizationProfile;
  const name = profile?.companyName ?? user.name;
  const slug = await uniqueClientSlug(name);

  const client = await db.client.create({
    data: {
      name,
      slug,
      email: user.email,
      industry: profile?.industry ?? null,
      website: profile?.website ?? null,
      city: profile?.city ?? null,
      country: "Colombia",
      organizationId: ctx.organizationId,
    },
  });

  await db.user.update({ where: { id: ctx.userId }, data: { companyId: client.id } });
  return client.id;
}

/* All client (customer brand) queries scope by active organization. */

export async function getClients(filters: FilterOptions = {}) {
  const ctx = await getOrgContext();
  if (!ctx) return [];

  const where: Prisma.ClientWhereInput = { organizationId: ctx.organizationId };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { industry: { contains: filters.search, mode: "insensitive" } },
      { city: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const clients = await db.client.findMany({
    where,
    include: {
      _count: { select: { campaigns: true, users: true } },
    },
    orderBy: { name: "asc" },
    take: filters.limit ?? 50,
    skip: filters.page ? (filters.page - 1) * (filters.limit ?? 50) : 0,
  });

  return clients.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function getClientById(id: string) {
  const ctx = await getOrgContext();
  if (!ctx) return null;

  const client = await db.client.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      campaigns: { orderBy: { createdAt: "desc" }, take: 10 },
      users: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { campaigns: true, users: true } },
    },
  });

  if (!client) return null;

  return {
    ...client,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}
