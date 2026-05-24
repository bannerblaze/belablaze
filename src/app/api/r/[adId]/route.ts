import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ adId: string }> },
) {
  const { adId } = await params;

  try {
    const ad = await db.ad.findUnique({
      where: { id: adId },
      select: { ctaUrl: true, qrEnabled: true },
    });

    if (!ad || !ad.qrEnabled) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    db.ad.update({
      where: { id: adId },
      data: { qrScans: { increment: 1 } },
    }).catch(() => {});

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    db.metric.updateMany({
      where: { adId, date: today },
      data: { qrScans: { increment: 1 } },
    }).catch(() => {});

    const destination = ad.ctaUrl || "https://bannerblaze.com";
    return NextResponse.redirect(destination);
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
}
