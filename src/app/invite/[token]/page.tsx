import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { InviteClient } from "./_client";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await db.invitation.findUnique({
    where: { token },
    include: {
      organization: { select: { name: true, logoUrl: true } },
    },
  });
  if (!invite) notFound();

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`);
  }

  return (
    <InviteClient
      token={token}
      email={invite.email}
      role={invite.role}
      status={invite.status}
      expiresAt={invite.expiresAt.toISOString()}
      organizationName={invite.organization.name}
      organizationLogo={invite.organization.logoUrl}
      userEmail={user.email}
    />
  );
}
