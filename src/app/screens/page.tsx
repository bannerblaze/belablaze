import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ScreensClient } from "./_client";
import { mockScreens } from "@/lib/mock-data";
import { requireOrgContext } from "@/lib/org-context";
import { checkPlatformStaffAccess } from "@/lib/access";

/* INTERNAL-only module — see layout.tsx for the access policy.
 *
 * The layout already short-circuits non-staff requests, but we re-check
 * here as a belt-and-suspenders measure (the layout could be bypassed
 * if Next ever changes how server components are invoked). */

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

  // Layer 2: re-check platform staff at the page level.
  const blocked = await checkPlatformStaffAccess("/dashboard");
  if (blocked) redirect(blocked);

  const hasDb = !!process.env.DATABASE_URL;

  if (!hasDb) {
    return (
      <ScreensClient
        screens={mockScreens as Parameters<typeof ScreensClient>[0]["screens"]}
        canCreate={false}
        canManage={false}
      />
    );
  }

  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const { getScreens } = await import("@/services/screens.service");
  const screens = await getScreens();

  return (
    <ScreensClient
      screens={screens as Parameters<typeof ScreensClient>[0]["screens"]}
      canCreate={true}
      canManage={true}
    />
  );
}

export default function ScreensPage() {
  return (
    <Suspense fallback={<ScreensSkeleton />}>
      <ScreensData />
    </Suspense>
  );
}
