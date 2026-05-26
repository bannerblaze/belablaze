"use server";

import crypto from "crypto";
import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";

export async function createPaymentReference(campaignId: string) {
  const ctx = await requireOrgContext();

  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, organizationId: ctx.organizationId },
  });

  if (!campaign) throw new Error("Campaña no encontrada");
  if (campaign.status !== "APPROVED") throw new Error("La campaña no está aprobada");
  if (campaign.budget <= 0) throw new Error("El presupuesto debe ser mayor a 0");

  const reference = `BB-${campaignId.slice(-8)}-${Date.now()}`;
  const amountInCents = Math.round(campaign.budget * 100);
  const currency = "COP";

  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET!;
  const signature = crypto
    .createHash("sha256")
    .update(`${reference}${amountInCents}${currency}${integritySecret}`)
    .digest("hex");

  await db.transaction.upsert({
    where: { reference },
    create: {
      campaignId,
      organizationId: ctx.organizationId,
      reference,
      amountInCents,
      currency,
      status: "PENDING",
    },
    update: {},
  });

  return {
    publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!,
    reference,
    amountInCents,
    currency,
    signature,
    redirectUrl: `https://app.bannerblaze.com/campaigns?payment=success`,
  };
}
