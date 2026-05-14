import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fromUserRole, type Role } from "@/types/rbac";
import type { UserRole } from "@/types";

/* ──────────────────────────────────────────────────────────────────────
 * Next.js 16 renamed `middleware.ts` → `proxy.ts`. This file is the
 * canonical edge-side request guard.
 *
 * Layers:
 *   • Auth gate (existing): protect everything except sign-in/up, webhook
 *     callbacks, and the marketing root.
 *   • Role gate (new): block access to admin/super-admin routes for users
 *     who don't have the matching global Role in Clerk publicMetadata.
 *
 * Routes use the REAL flat structure (/campaigns not /dashboard/campaigns).
 * ────────────────────────────────────────────────────────────────────── */

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const isSuperAdminRoute = createRouteMatcher([
  "/settings/billing(.*)",
  "/settings/activity(.*)",
  "/settings/danger(.*)",
]);

const isAdminRoute = createRouteMatcher([
  "/settings/team(.*)",
  "/settings/security(.*)",
  "/settings/api-keys(.*)",
  "/settings/webhooks(.*)",
  "/settings/branding(.*)",
]);

const isStaffRoute = createRouteMatcher([
  "/screens(.*)",
  "/approvals(.*)",
  "/clients(.*)",
]);

type SessionClaimsLike = {
  publicMetadata?: { role?: string };
  unsafeMetadata?: { role?: string };
};

function resolveRoleFromClaims(claims: SessionClaimsLike | null | undefined): Role {
  const raw = claims?.publicMetadata?.role ?? claims?.unsafeMetadata?.role;
  if (!raw) return "viewer";
  if (/^(super_admin|admin|staff|client|viewer)$/.test(raw)) return raw as Role;
  return fromUserRole(raw.toUpperCase() as UserRole);
}

const unauthorized = (req: Request) => NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn({ returnBackUrl: req.url });

  const role = resolveRoleFromClaims(sessionClaims as SessionClaimsLike | null);

  if (isSuperAdminRoute(req) && role !== "super_admin") return unauthorized(req);
  if (isAdminRoute(req) && role !== "super_admin" && role !== "admin") return unauthorized(req);
  if (isStaffRoute(req) && (role === "client" || role === "viewer")) return unauthorized(req);

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
