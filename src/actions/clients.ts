"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, role: true } });
  if (!user || user.role !== "ADMIN") throw new Error("Solo admins pueden gestionar clientes");
  return user;
}

export async function createClient(formData: FormData) {
  const user = await requireAdmin();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const industry = formData.get("industry") as string;
  const city = formData.get("city") as string;
  const phone = formData.get("phone") as string;
  const website = formData.get("website") as string;
  const creditLimit = parseFloat(formData.get("creditLimit") as string) || 0;

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const client = await db.client.create({
    data: { name, email, industry, city, phone, website, creditLimit, slug },
  });

  await db.log.create({
    data: { userId: user.id, action: "CREATE", entity: "Client", entityId: client.id, newData: { name } },
  });

  revalidatePath("/clients");
  return { success: true, id: client.id };
}

export async function updateClient(clientId: string, formData: FormData) {
  const user = await requireAdmin();

  const data: Record<string, string | number | boolean> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "creditLimit") data[key] = parseFloat(value as string) || 0;
    else if (key === "isActive") data[key] = value === "true";
    else data[key] = value as string;
  }

  await db.client.update({ where: { id: clientId }, data });
  await db.log.create({
    data: { userId: user.id, action: "UPDATE", entity: "Client", entityId: clientId, newData: data },
  });

  revalidatePath("/clients");
  return { success: true };
}
