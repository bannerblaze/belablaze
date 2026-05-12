"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function requireAdminOrExecutive() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, role: true } });
  if (!user || (user.role !== "ADMIN" && user.role !== "EXECUTIVE")) throw new Error("Sin permisos");
  return user;
}

export async function updateScreenStatus(screenId: string, status: "ONLINE" | "OFFLINE" | "MAINTENANCE") {
  const user = await requireAdminOrExecutive();

  await db.screen.update({
    where: { id: screenId },
    data: {
      status,
      lastPingAt: status === "ONLINE" ? new Date() : undefined,
    },
  });

  await db.log.create({
    data: { userId: user.id, action: "UPDATE", entity: "Screen", entityId: screenId, newData: { status } },
  });

  revalidatePath("/screens");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function pingScreen(screenId: string) {
  await db.screen.update({
    where: { id: screenId },
    data: { lastPingAt: new Date() },
  });

  revalidatePath("/screens");
  return { success: true };
}

export async function createScreen(data: {
  name: string;
  type: string;
  city: string;
  address: string;
  width: number;
  height: number;
  resolutionWidth?: number;
  resolutionHeight?: number;
  dailyTraffic?: number;
  pricePerSecond?: number;
  orientation?: string;
  notes?: string;
}) {
  const user = await requireAdminOrExecutive();

  const code = `SCR-${Date.now().toString(36).toUpperCase()}`;

  const screen = await db.screen.create({
    data: {
      name: data.name,
      code,
      type: data.type as Parameters<typeof db.screen.create>[0]["data"]["type"],
      city: data.city,
      address: data.address,
      width: data.width,
      height: data.height,
      resolutionWidth: data.resolutionWidth ?? 1920,
      resolutionHeight: data.resolutionHeight ?? 1080,
      dailyTraffic: data.dailyTraffic ?? 0,
      pricePerSecond: data.pricePerSecond ?? 0,
      orientation: data.orientation ?? "landscape",
      notes: data.notes,
      status: "ONLINE",
      lastPingAt: new Date(),
    },
  });

  await db.log.create({
    data: { userId: user.id, action: "CREATE", entity: "Screen", entityId: screen.id, newData: { name: data.name } },
  });

  revalidatePath("/screens");
  revalidatePath("/dashboard");

  return { success: true, id: screen.id };
}

export async function updateScreen(screenId: string, data: {
  name?: string;
  address?: string;
  city?: string;
  dailyTraffic?: number;
  pricePerSecond?: number;
  notes?: string;
  isActive?: boolean;
}) {
  const user = await requireAdminOrExecutive();

  await db.screen.update({ where: { id: screenId }, data });
  await db.log.create({
    data: { userId: user.id, action: "UPDATE", entity: "Screen", entityId: screenId, newData: data },
  });

  revalidatePath("/screens");

  return { success: true };
}
