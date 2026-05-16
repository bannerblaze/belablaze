import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ClientsClient } from "./_client";
import { checkPlatformStaffAccess } from "@/lib/access";
import {
  getAdminOverview,
  getOrganizationUsers,
  getCreatorUsers,
} from "@/services/admin/users.service";

/* INTERNAL admin panel — see layout.tsx for the access policy.
 *
 * The layout already short-circuits non-staff requests, but we re-check
 * here as a belt-and-suspenders measure. */

function PanelSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-6 max-w-[1500px]">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
      <div className="h-12 w-72 rounded-xl bg-white/[0.03] animate-pulse" />
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

async function ClientsData() {
  await connection();

  const blocked = await checkPlatformStaffAccess("/dashboard");
  if (blocked) redirect(blocked);

  const [overview, orgUsers, creatorUsers] = await Promise.all([
    getAdminOverview(),
    getOrganizationUsers(),
    getCreatorUsers(),
  ]);

  if (!overview) redirect("/dashboard");

  return (
    <ClientsClient
      overview={overview}
      orgUsers={orgUsers}
      creatorUsers={creatorUsers}
    />
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <ClientsData />
    </Suspense>
  );
}
