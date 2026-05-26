import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, timestamp, signature } = body;

    // Verify Wompi event signature
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET!;
    const expectedChecksum = crypto
      .createHash("sha256")
      .update(`${data.transaction.id}${timestamp}${eventsSecret}`)
      .digest("hex");

    if (signature?.checksum !== expectedChecksum) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const wompiTx = data.transaction;

    // Update transaction record
    const dbTx = await db.transaction.findUnique({
      where: { reference: wompiTx.reference },
    });

    if (!dbTx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    await db.transaction.update({
      where: { reference: wompiTx.reference },
      data: {
        wompiId:       wompiTx.id,
        status:        wompiTx.status,
        paymentMethod: wompiTx.payment_method_type ?? null,
      },
    });

    // Activate campaign on successful payment
    if (wompiTx.status === "APPROVED") {
      await db.campaign.update({
        where: { id: dbTx.campaignId },
        data:  { status: "ACTIVE" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Wompi webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
