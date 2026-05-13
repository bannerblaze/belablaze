import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ campaigns: [], clients: [], screens: [], ads: [] });
  }

  const [campaigns, clients, screens, ads] = await Promise.all([
    db.campaign.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, status: true },
      take: 5,
    }),
    db.client.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, industry: true },
      take: 5,
    }),
    db.screen.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, city: true, status: true },
      take: 5,
    }),
    db.ad.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { id: true, title: true, status: true, format: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ campaigns, clients, screens, ads });
}
