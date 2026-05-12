import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { upsertUser, deleteUser } from "@/services/users.service";

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    public_metadata?: { role?: "ADMIN" | "EXECUTIVE" | "CLIENT" };
  };
};

function verifySvixSignature(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string,
): boolean {
  try {
    const toSign = `${svixId}.${svixTimestamp}.${payload}`;
    const secretBytes = Buffer.from(secret.replace("whsec_", ""), "base64");
    const hmac = createHmac("sha256", secretBytes);
    hmac.update(toSign);
    const computed = `v1,${hmac.digest("base64")}`;
    const signatures = svixSignature.split(" ");
    return signatures.some((sig) => sig === computed);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const isValid = verifySvixSignature(body, svixId, svixTimestamp, svixSignature, webhookSecret);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: ClerkWebhookEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.created" || type === "user.updated") {
    const email = data.email_addresses[0]?.email_address ?? "";
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || email;
    const role = data.public_metadata?.role ?? "CLIENT";

    await upsertUser({
      clerkId: data.id,
      email,
      name,
      avatar: data.image_url,
      role,
    });
  }

  if (type === "user.deleted") {
    await deleteUser(data.id);
  }

  return NextResponse.json({ received: true });
}
