"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { logAudit } from "@/actions/audit";

export async function listClients() {
  const ctx = await requireOrgContext();
  return db.client.findMany({
    where: { organizationId: ctx.organizationId },
    select: {
      id: true, name: true, logo: true, email: true, phone: true,
      industry: true, city: true, isActive: true, createdAt: true,
      users: { select: { role: true }, take: 10 },
      _count: { select: { campaigns: true } },
    },
    orderBy: { name: "asc" },
  });
}

export interface ClientDetail {
  id: string;
  name: string;
  logo: string | null;
  email: string;
  phone: string | null;
  industry: string | null;
  city: string | null;
  country: string;
  website: string | null;
  address: string | null;
  taxId: string | null;
  isActive: boolean;
  creditLimit: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
  users: { id: string; name: string; email: string; role: string; status: string; lastLoginAt: string | null }[];
  campaigns: {
    id: string; name: string; status: string; budget: number; spent: number;
    startDate: string; endDate: string; impressions: number; createdAt: string;
  }[];
  auditLogs: {
    id: string; action: string; metadata: Record<string, unknown> | null;
    createdAt: string; user: { name: string; email: string } | null;
  }[];
  _count: { campaigns: number; users: number };
}

export async function getClientDetail(clientId: string): Promise<ClientDetail | null> {
  const ctx = await requireOrgContext();

  const client = await db.client.findFirst({
    where: { id: clientId, organizationId: ctx.organizationId },
    select: {
      id: true, name: true, logo: true,
      email: true, phone: true, industry: true,
      city: true, country: true, website: true, address: true, taxId: true,
      isActive: true, creditLimit: true, balance: true,
      createdAt: true, updatedAt: true,
      users: {
        select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true },
      },
      campaigns: {
        select: {
          id: true, name: true, status: true, budget: true, spent: true,
          startDate: true, endDate: true, impressions: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { campaigns: true, users: true } },
    },
  });

  if (!client) return null;

  const auditLogs = await db.auditLog.findMany({
    where: { entityType: "Client", entityId: clientId, organizationId: ctx.organizationId },
    select: {
      id: true, action: true, metadata: true, createdAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return {
    ...client,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    users: client.users.map((u) => ({
      ...u,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    })),
    campaigns: client.campaigns.map((c) => ({
      ...c,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      createdAt: c.createdAt.toISOString(),
    })),
    auditLogs: auditLogs.map((l) => ({
      ...l,
      metadata: l.metadata as Record<string, unknown> | null,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}

/* Tenant-scoped customer-brand mutations. Slugs are unique per org so
 * we must namespace the uniqueness check; on collision we append a
 * short suffix instead of throwing the raw Prisma constraint error. */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function uniqueSlugFor(name: string, organizationId: string): Promise<string> {
  const base = slugify(name) || `client-${Date.now().toString(36)}`;
  let candidate = base;
  let n = 1;
  while (await db.client.findFirst({ where: { slug: candidate, organizationId }, select: { id: true } })) {
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 50) {
      candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      break;
    }
  }
  return candidate;
}

async function loadOrgClient(orgId: string, clientId: string) {
  return db.client.findFirst({
    where: { id: clientId, organizationId: orgId },
    select: { id: true, name: true },
  });
}

export async function createClient(formData: FormData) {
  const ctx = await requireOrgContext();

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 2) throw new Error("Nombre inválido");

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const industry = (formData.get("industry") as string) || null;
  const city = (formData.get("city") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const website = (formData.get("website") as string) || null;
  const creditLimit = parseFloat(formData.get("creditLimit") as string) || 0;

  const slug = await uniqueSlugFor(name, ctx.organizationId);

  const client = await db.client.create({
    data: {
      name, email, industry, city, phone, website, creditLimit, slug,
      organizationId: ctx.organizationId,
    },
  });

  await logAudit({
    action: "client.create",
    entityType: "Client",
    entityId: client.id,
    metadata: { name, slug },
  });

  revalidatePath("/clients");
  return { success: true, id: client.id };
}

export async function updateClient(clientId: string, formData: FormData) {
  const ctx = await requireOrgContext();

  const existing = await loadOrgClient(ctx.organizationId, clientId);
  if (!existing) throw new Error("Cliente no encontrado");

  const data: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "creditLimit") data[key] = parseFloat(value as string) || 0;
    else if (key === "isActive") data[key] = value === "true";
    else if (typeof value === "string") data[key] = value || null;
  }

  await db.client.update({ where: { id: clientId }, data });
  await logAudit({
    action: "client.update",
    entityType: "Client",
    entityId: clientId,
    metadata: { changes: Object.keys(data) },
  });
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteClient(clientId: string) {
  const ctx = await requireOrgContext();

  const existing = await loadOrgClient(ctx.organizationId, clientId);
  if (!existing) throw new Error("Cliente no encontrado");

  // Soft check — campaigns referencing this client would be orphaned.
  const campaigns = await db.campaign.count({
    where: { clientId, organizationId: ctx.organizationId },
  });
  if (campaigns > 0) {
    throw new Error(`Este cliente tiene ${campaigns} campaña(s) activa(s). Archívalas primero.`);
  }

  await db.client.delete({ where: { id: clientId } });
  await logAudit({
    action: "client.delete",
    entityType: "Client",
    entityId: clientId,
    metadata: { name: existing.name },
  });
  revalidatePath("/clients");
  return { success: true };
}
