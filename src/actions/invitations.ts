"use server";

import { z } from "zod";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireOrgContext } from "@/lib/org-context";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/actions/audit";
import type { OrgRole } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Invitation server actions.
 *
 * Tokens are URL-safe 24-byte hex strings (no PII embedded). Expire after
 * 7 days by default. The accept-flow keys off `Invitation.token` and is
 * idempotent — replaying the same token after acceptance is a no-op.
 * ────────────────────────────────────────────────────────────────────── */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const INVITE_TTL_MS = 7 * 24 * 3600 * 1000;
const ALLOWED_ROLES: OrgRole[] = ["ADMIN", "EXECUTIVE", "MANAGER", "EDITOR", "ANALYST", "VIEWER"];

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(ALLOWED_ROLES as [OrgRole, ...OrgRole[]]),
});

function newToken(): string {
  return randomBytes(24).toString("hex");
}

export async function inviteMember(input: z.infer<typeof inviteSchema>): Promise<Result<{ token: string }>> {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "members:invite");

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const { email, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await db.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
  if (existingUser) {
    const already = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: ctx.organizationId, userId: existingUser.id } },
      select: { id: true },
    });
    if (already) return { ok: false, error: "Ese usuario ya pertenece a la organización." };
  }

  const existingInvite = await db.invitation.findFirst({
    where: { organizationId: ctx.organizationId, email: normalizedEmail, status: "PENDING" },
  });
  if (existingInvite) {
    return { ok: true, data: { token: existingInvite.token } };
  }

  const token = newToken();
  await db.invitation.create({
    data: {
      email: normalizedEmail,
      token,
      organizationId: ctx.organizationId,
      role,
      invitedBy: ctx.userId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  await logAudit({
    action: "member.invite",
    entityType: "Invitation",
    metadata: { email: normalizedEmail, role },
  });

  revalidatePath("/settings/team");
  return { ok: true, data: { token } };
}

export async function revokeInvitation(invitationId: string): Promise<Result> {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "members:invite");

  const invite = await db.invitation.findUnique({ where: { id: invitationId } });
  if (!invite || invite.organizationId !== ctx.organizationId) {
    return { ok: false, error: "Invitación no encontrada." };
  }
  if (invite.status !== "PENDING") return { ok: false, error: "Esta invitación ya no está pendiente." };

  await db.invitation.update({ where: { id: invitationId }, data: { status: "REVOKED" } });
  await logAudit({ action: "member.invite", entityType: "Invitation", entityId: invitationId, metadata: { revoked: true } });
  revalidatePath("/settings/team");
  return { ok: true };
}

export async function resendInvitation(invitationId: string): Promise<Result<{ token: string }>> {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "members:invite");

  const invite = await db.invitation.findUnique({ where: { id: invitationId } });
  if (!invite || invite.organizationId !== ctx.organizationId) {
    return { ok: false, error: "Invitación no encontrada." };
  }
  if (invite.status !== "PENDING") return { ok: false, error: "No se puede reenviar." };

  await db.invitation.update({
    where: { id: invitationId },
    data: { expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
  });
  return { ok: true, data: { token: invite.token } };
}

export async function acceptInvitation(token: string): Promise<Result<{ organizationId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Inicia sesión primero." };

  const invite = await db.invitation.findUnique({ where: { token } });
  if (!invite) return { ok: false, error: "Token inválido." };
  if (invite.status !== "PENDING") return { ok: false, error: "Esta invitación ya fue procesada." };
  if (invite.expiresAt < new Date()) {
    await db.invitation.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
    return { ok: false, error: "Esta invitación expiró." };
  }
  if (invite.email !== user.email.toLowerCase()) {
    return { ok: false, error: "Esta invitación es para otro correo." };
  }

  await db.$transaction([
    db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: invite.organizationId, userId: user.id } },
      create: {
        organizationId: invite.organizationId,
        userId: user.id,
        role: invite.role,
        invitedBy: invite.invitedBy,
      },
      update: { role: invite.role },
    }),
    db.invitation.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    }),
    db.user.update({ where: { id: user.id }, data: { activeOrgId: invite.organizationId } }),
  ]);

  await logAudit({
    action: "member.accept",
    entityType: "Organization",
    entityId: invite.organizationId,
    metadata: { invitationId: invite.id, role: invite.role },
  });
  revalidatePath("/", "layout");
  return { ok: true, data: { organizationId: invite.organizationId } };
}

const updateRoleSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(["ADMIN", "EXECUTIVE", "MANAGER", "EDITOR", "ANALYST", "VIEWER"] as [OrgRole, ...OrgRole[]]),
});

export async function updateMemberRole(input: z.infer<typeof updateRoleSchema>): Promise<Result> {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "members:update_role");

  const parsed = updateRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const member = await db.organizationMember.findUnique({ where: { id: parsed.data.memberId } });
  if (!member || member.organizationId !== ctx.organizationId) return { ok: false, error: "Miembro no encontrado." };
  if (member.role === "OWNER") return { ok: false, error: "No puedes cambiar el rol del propietario." };

  await db.organizationMember.update({
    where: { id: parsed.data.memberId },
    data: { role: parsed.data.role },
  });
  await logAudit({
    action: "member.update_role",
    entityType: "OrganizationMember",
    entityId: parsed.data.memberId,
    metadata: { newRole: parsed.data.role, prevRole: member.role },
  });
  revalidatePath("/settings/team");
  return { ok: true };
}

export async function removeMember(memberId: string): Promise<Result> {
  const ctx = await requireOrgContext();
  assertCan(ctx.role, "members:remove");

  const member = await db.organizationMember.findUnique({ where: { id: memberId } });
  if (!member || member.organizationId !== ctx.organizationId) return { ok: false, error: "Miembro no encontrado." };
  if (member.role === "OWNER") return { ok: false, error: "No puedes remover al propietario." };
  if (member.userId === ctx.userId) return { ok: false, error: "Usa 'Salir' para abandonar la organización." };

  await db.organizationMember.delete({ where: { id: memberId } });
  await logAudit({
    action: "member.remove",
    entityType: "OrganizationMember",
    entityId: memberId,
    metadata: { removedUserId: member.userId, prevRole: member.role },
  });
  revalidatePath("/settings/team");
  return { ok: true };
}

export async function listTeam(): Promise<{
  members: Array<{
    id: string;
    userId: string;
    role: OrgRole;
    joinedAt: Date;
    lastActiveAt: Date | null;
    user: { id: string; email: string; name: string; avatar: string | null };
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: OrgRole;
    expiresAt: Date;
    createdAt: Date;
  }>;
}> {
  const ctx = await requireOrgContext();
  const [members, invitations] = await Promise.all([
    db.organizationMember.findMany({
      where: { organizationId: ctx.organizationId },
      include: { user: { select: { id: true, email: true, name: true, avatar: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    db.invitation.findMany({
      where: { organizationId: ctx.organizationId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { members, invitations };
}
