import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { listTeam } from "@/actions/invitations";
import { SettingsShell } from "@/components/settings/settings-nav";
import { TeamClient } from "./_client";

export default async function TeamPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/onboarding");

  const { members, invitations } = await listTeam();

  return (
    <SettingsShell>
      <TeamClient
        currentUserId={ctx.userId}
        currentRole={ctx.role}
        orgName={ctx.organizationName}
        members={members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          lastActiveAt: m.lastActiveAt?.toISOString() ?? null,
          email: m.user.email,
          name: m.user.name,
          avatar: m.user.avatar,
        }))}
        invitations={invitations.map((i) => ({
          id: i.id,
          token: i.token,
          email: i.email,
          role: i.role,
          expiresAt: i.expiresAt.toISOString(),
          createdAt: i.createdAt.toISOString(),
        }))}
      />
    </SettingsShell>
  );
}
