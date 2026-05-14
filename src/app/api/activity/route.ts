import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
  const entityType = searchParams.get("entity");
  const action = searchParams.get("action");

  const logs = await db.auditLog.findMany({
    where: {
      organizationId: ctx.organizationId,
      ...(entityType ? { entityType } : {}),
      ...(action ? { action } : {}),
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ data: logs });
}
