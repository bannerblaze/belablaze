import { getOrgContext } from "@/lib/org-context";
import type { FilterOptions } from "@/types";
import {
  getScreensByOrganization,
  getScreenById as repoGetById,
  getScreenMetrics as repoGetMetrics,
} from "@/server/repositories/screens.repository";

/* ──────────────────────────────────────────────────────────────────────
 * Screen read queries — org-scoped.
 *
 * Every function resolves the caller's org context first and gates on
 * it. A missing or unauthenticated session returns safe empty values
 * rather than throwing, so server components can render without an
 * error boundary for the read path.
 *
 * All DB calls are wrapped in try/catch so a transient DB error or a
 * schema migration in progress never crashes a calling page.
 * ────────────────────────────────────────────────────────────────────── */

function serializeScreen<T extends {
  lastPingAt: Date | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>(s: T) {
  return {
    ...s,
    lastPingAt: s.lastPingAt?.toISOString()  ?? null,
    lastSeenAt: s.lastSeenAt?.toISOString()  ?? null,
    createdAt:  s.createdAt.toISOString(),
    updatedAt:  s.updatedAt.toISOString(),
  };
}

export async function getScreens(filters: FilterOptions = {}) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return [];

    const screens = await getScreensByOrganization(ctx.organizationId, {
      search: filters.search,
      status: filters.status,
      city:   filters.city,
      limit:  filters.limit,
      page:   filters.page,
    });

    return screens.map(serializeScreen);
  } catch {
    return [];
  }
}

export async function getScreenById(id: string) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return null;

    const screen = await repoGetById(id, ctx.organizationId);
    if (!screen) return null;

    return serializeScreen(screen);
  } catch {
    return null;
  }
}

export async function getScreenMetrics() {
  try {
    const ctx = await getOrgContext();
    if (!ctx) return { total: 0, online: 0, offline: 0, maintenance: 0 };

    return repoGetMetrics(ctx.organizationId);
  } catch {
    return { total: 0, online: 0, offline: 0, maintenance: 0 };
  }
}
