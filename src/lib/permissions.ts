import { getCurrentUser, AuthError, type AuthUser } from "@/lib/auth";

/**
 * Permission gates that complement requireAdmin / requireAdminOrExecutive
 * from auth.ts. All throw AuthError so server actions surface a clean
 * message and pages can render the unauthorized empty state.
 */

/** Throws if the user has not finished onboarding. */
export async function requireOnboardedUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("No autenticado", "unauthenticated");
  if (!user.onboardingCompleted) {
    throw new AuthError("Debes completar el onboarding primero", "forbidden");
  }
  return user;
}

/** Throws unless the user is a COMPANY (typically scoped to org resources). */
export async function requireCompany(): Promise<AuthUser> {
  const user = await requireOnboardedUser();
  if (user.role !== "COMPANY" && user.role !== "ADMIN" && user.role !== "EXECUTIVE") {
    throw new AuthError("Sin permisos: se requiere cuenta de empresa", "forbidden");
  }
  return user;
}

/** Throws unless the user is a CREATOR (or staff). */
export async function requireCreator(): Promise<AuthUser> {
  const user = await requireOnboardedUser();
  if (user.role !== "CREATOR" && user.role !== "ADMIN" && user.role !== "EXECUTIVE") {
    throw new AuthError("Sin permisos: se requiere cuenta de creator", "forbidden");
  }
  return user;
}
