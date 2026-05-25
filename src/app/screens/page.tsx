import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ScreensClient } from "./_client";
import { requireOrgContext } from "@/lib/org-context";
import { getCurrentUser } from "@/lib/auth";

/* ──────────────────────────────────────────────────────────────────────
 * /screens — DOOH fleet operations console.
 *
 * Layout already gates by accountType (ORGANIZATION | INTERNAL). This
 * page resolves the org context and streams real screen data from the
 * database. Errors during data fetch are caught and surfaced as empty
 * state rather than crashing the server component.
 * ────────────────────────────────────────────────────────────────────── */

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

  const dbUser = await getCurrentUser().catch(() => null);
  const isInternal = dbUser?.accountType === "INTERNAL";

  if (!isInternal) {
    const ctx = await requireOrgContext().catch(() => null);
    if (!ctx) redirect("/onboarding");
  }

  let screens: Awaited<ReturnType<typeof import("@/services/screens.service")["getScreens"]>> = [];

  try {
    const { getScreens } = await import("@/services/screens.service");
    screens = await getScreens();
  } catch {
    // DB error — show empty state, user can still create screens
    screens = [];
  }

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
