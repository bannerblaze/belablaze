"use server";

import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function createWebhook(url: string, events: string[]) {
  const ctx = await requireOrgContext();

  if (!url.startsWith("https://")) {
    throw new Error("La URL debe usar HTTPS");
  }

  const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

  await db.webhook.create({
    data: {
      organizationId: ctx.organizationId,
      url,
      events,
      secret,
      isActive: true,
    },
  });

  revalidatePath("/settings/webhooks");
  return { secret };
}

export async function toggleWebhook(id: string) {
  const ctx = await requireOrgContext();

  const webhook = await db.webhook.findFirst({
    where: { id, organizationId: ctx.organizationId },
  });
  if (!webhook) throw new Error("Webhook no encontrado");

  await db.webhook.update({
    where: { id },
    data: { isActive: !webhook.isActive },
  });

  revalidatePath("/settings/webhooks");
}

export async function deleteWebhook(id: string) {
  const ctx = await requireOrgContext();

  await db.webhook.deleteMany({
    where: { id, organizationId: ctx.organizationId },
  });

  revalidatePath("/settings/webhooks");
}
