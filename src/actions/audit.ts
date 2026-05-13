"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";

/* ──────────────────────────────────────────────────────────────────────
 * Audit log helper.
 *
 * Every mutating server action calls `logAudit()` to record:
 *   - actor (userId)  - org scope (organizationId)
 *   - action verb     - entity type + id
 *   - free-form metadata (diffs, reasons, etc.)
 *   - client ip + UA  - timestamp
 *
 * The function swallows DB errors deliberately — audit failures must
 * NEVER block the underlying action. We log to console as a last resort
 * so the signal isn't silently lost.
 * ────────────────────────────────────────────────────────────────────── */

export type AuditAction =
  | "user.login" | "user.logout"
  | "org.create" | "org.update" | "org.delete" | "org.switch"
  | "member.invite" | "member.accept" | "member.update_role" | "member.remove" | "member.leave"
  | "campaign.create" | "campaign.update" | "campaign.delete" | "campaign.approve" | "campaign.pause"
  | "ad.create" | "ad.update" | "ad.delete" | "ad.approve" | "ad.reject"
  | "screen.create" | "screen.update" | "screen.delete"
  | "client.create" | "client.update" | "client.delete"
  | "media.upload" | "media.delete"
  | "schedule.create" | "schedule.update" | "schedule.delete"
  | "billing.update_plan"
  | "apikey.create" | "apikey.revoke"
  | "webhook.create" | "webhook.update" | "webhook.delete"
  | "settings.update";

export type AuditPayload = {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

async function getMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null,
    userAgent: h.get("user-agent") ?? null,
  };
}

export async function logAudit(payload: AuditPayload): Promise<void> {
  try {
    const ctx = await getOrgContext();
    const meta = await getMeta();
    await db.auditLog.create({
      data: {
        organizationId: ctx?.organizationId ?? null,
        userId: ctx?.userId ?? null,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId ?? null,
        metadata: (payload.metadata ?? {}) as object,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });
  } catch (err) {
    console.error("[audit] failed to persist AuditLog:", err);
  }
}

/** Server-action wrapper used by /settings/activity. */
export async function listAuditLogs(input: {
  organizationId: string;
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  userId?: string;
}) {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(10, input.limit ?? 50));

  const where = {
    organizationId: input.organizationId,
    ...(input.action ? { action: input.action } : {}),
    ...(input.entityType ? { entityType: input.entityType } : {}),
    ...(input.userId ? { userId: input.userId } : {}),
  };

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
