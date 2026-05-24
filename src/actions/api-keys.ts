"use server";

import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function createApiKey(name: string, scopes: string[]) {
  const ctx = await requireOrgContext();

  const rawKey = `bb_${crypto.randomBytes(24).toString("hex")}`;
  const keyPrefix = rawKey.slice(0, 10);
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  await db.apiKey.create({
    data: {
      organizationId: ctx.organizationId,
      name,
      keyPrefix,
      keyHash,
      scopes,
      createdBy: ctx.userId,
    },
  });

  revalidatePath("/settings/api-keys");
  return { rawKey };
}

export async function revokeApiKey(id: string) {
  const ctx = await requireOrgContext();

  await db.apiKey.updateMany({
    where: { id, organizationId: ctx.organizationId },
    data: { revokedAt: new Date() },
  });

  revalidatePath("/settings/api-keys");
}
