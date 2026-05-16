import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/* ──────────────────────────────────────────────────────────────────────
 * Next.js 16 renamed `middleware.ts` → `proxy.ts`. This file is the
 * canonical edge-side request guard.
 *
 * What this layer does:
 *   • Allow truly public routes (sign-in/up, webhook callbacks, marketing).
 *   • Require an authenticated session for everything else.
 *
 * What this layer does NOT do anymore (intentionally):
 *   Per-feature / per-role gating. The proxy only has access to the
 *   user's *global* Role from Clerk publicMetadata, which conflates
 *   "BannerBlaze internal staff vs paying customer" with "what can this
 *   person do inside their org". Those are different concerns:
 *
 *     - Global Role  → who is this user to the platform.
 *     (per-org RBAC removed — every org has exactly one user, the owner.)
 *
 *   Per-page decisions (internal operations, accountType-only surfaces)
 *   are made server-side via src/lib/access.ts. The earlier
 *   `isSuperAdminRoute` / `isAdminRoute` / `isStaffRoute` matchers here
 *   were redirecting customers away from their own product — removed.
 * ────────────────────────────────────────────────────────────────────── */

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn({ returnBackUrl: req.url });

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
