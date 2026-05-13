import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsClient } from "./_client";
import { SettingsShell } from "@/components/settings/settings-nav";
import type { UserRole } from "@/types";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Load profile data based on account type — keeps the wire format flat and
  // serialisable so we can pass it straight to the client component.
  const [orgRow, creatorRow] = await Promise.all([
    user.accountType === "ORGANIZATION"
      ? db.organizationProfile.findUnique({ where: { userId: user.id } })
      : Promise.resolve(null),
    user.accountType === "PERSON"
      ? db.creatorProfile.findUnique({ where: { userId: user.id } })
      : Promise.resolve(null),
  ]);

  const organization = orgRow
    ? {
        companyName: orgRow.companyName,
        nit: orgRow.nit,
        industry: orgRow.industry,
        companySize: orgRow.companySize,
        website: orgRow.website,
        logoUrl: orgRow.logoUrl,
        country: orgRow.country,
        city: orgRow.city,
        contactName: orgRow.contactName,
        contactPhone: orgRow.contactPhone,
      }
    : null;

  const creator = creatorRow
    ? {
        displayName: creatorRow.displayName,
        category: creatorRow.category,
        instagram: creatorRow.instagram,
        tiktok: creatorRow.tiktok,
        youtube: creatorRow.youtube,
        website: creatorRow.website,
        avatarUrl: creatorRow.avatarUrl,
        country: creatorRow.country,
        city: creatorRow.city,
      }
    : null;

  return (
    <SettingsShell>
      <SettingsClient
        role={user.role as UserRole}
        accountType={user.accountType}
        organization={organization}
        creator={creator}
      />
    </SettingsShell>
  );
}
