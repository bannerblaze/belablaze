import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAdsForApprovals } from "@/services/ads.service";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await getAdsForApprovals();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, role: true } });
    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "EXECUTIVE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { adId, action, note } = await req.json();
    if (!adId || !action) return NextResponse.json({ error: "Missing adId or action" }, { status: 400 });

    const approved = action === "approve";
    const status = approved ? "APPROVED" : "REJECTED";

    await db.$transaction([
      db.ad.update({ where: { id: adId }, data: { status, ...(note && { rejectionNote: note }) } }),
      db.adApproval.create({ data: { adId, userId: dbUser.id, approved, note } }),
      db.log.create({ data: { userId: dbUser.id, action: approved ? "APPROVE" : "REJECT", entity: "Ad", entityId: adId, newData: { note } } }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
