import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { FilterOptions } from "@/types";
import { getOrgContext } from "@/lib/org-context";

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
