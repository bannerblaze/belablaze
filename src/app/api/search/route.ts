import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ campaigns: [], clients: [], screens: [], ads: [] });
  }

  const orgId = ctx.organizationId;

  const [campaigns, clients, screens, ads] = await Promise.all([
    db.campaign.findMany({
      where: { organizationId: orgId, name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, status: true },
      take: 5,
    }),
    db.client.findMany({
      where: {
        organizationId: orgId,
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
        organizationId: orgId,
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
      where: { campaign: { organizationId: orgId }, title: { contains: q, mode: "insensitive" } },
      select: { id: true, title: true, status: true, format: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ campaigns, clients, screens, ads });
}
