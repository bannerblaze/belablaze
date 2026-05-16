/* ──────────────────────────────────────────────────────────────────────
 * Per-org permissions — degenerate single-owner model.
 *
 * BelaBlaze used to have a six-role matrix (OWNER / ADMIN / EXECUTIVE
 * / MANAGER / EDITOR / ANALYST / VIEWER) with a per-permission lookup
 * table. That entire system is gone. The product is single-tenant per
 * user: 1 account = 1 organization owned by that account. There is no
 * "role inside the org" because there is no one else in the org.
 *
 * What survives in this file:
 *   • `Permission` type        — kept only so existing action sigs
 *                                read cleanly. Not enforced.
 *
 * What was deleted:
 *   • OrgRole, ROLE_MATRIX, can(), canAny(), canAll(), assertCan(),
 *     PermissionError, ORG_ROLE_LABELS, ORG_ROLE_COLORS,
 *     isElevatedRole — and every callsite that referenced them.
 *
 * Cross-tenant gates live in src/lib/access.ts (PlatformRole +
 * AccountType). Tenant scoping still happens through
 * `organizationId` on every query.
 * ────────────────────────────────────────────────────────────────────── */

export type Permission =
  | "org:view" | "org:update" | "org:delete"
  | "billing:view" | "billing:manage"
  | "campaigns:view" | "campaigns:create" | "campaigns:update" | "campaigns:delete" | "campaigns:schedule"
  | "ads:view" | "ads:create" | "ads:update" | "ads:delete" | "ads:approve"
  | "screens:view" | "screens:create" | "screens:update" | "screens:delete"
  | "clients:view" | "clients:manage"
  | "media:view" | "media:upload" | "media:delete"
  | "analytics:view" | "analytics:export"
  | "audit:view" | "apikeys:manage" | "webhooks:manage" | "settings:update";
