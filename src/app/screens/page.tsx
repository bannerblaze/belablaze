import { Suspense } from "react";
import { connection } from "next/server";
import { ScreensClient } from "./_client";
import { mockScreens } from "@/lib/mock-data";

function ScreensSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-56 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

async function ScreensData() {
  await connection();
  const hasDb = !!process.env.DATABASE_URL;

  if (!hasDb) {
    return <ScreensClient screens={mockScreens as Parameters<typeof ScreensClient>[0]["screens"]} />;
  }

  const { getScreens } = await import("@/services/screens.service");
  const screens = await getScreens();

  return <ScreensClient screens={screens as Parameters<typeof ScreensClient>[0]["screens"]} />;
}

export default function ScreensPage() {
  return (
    <Suspense fallback={<ScreensSkeleton />}>
      <ScreensData />
    </Suspense>
  );
}
