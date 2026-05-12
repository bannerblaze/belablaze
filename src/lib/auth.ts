import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type UserRole = "admin" | "ejecutivo" | "cliente";

interface SessionMetadata {
  role?: UserRole;
}

/** Returns the current user's role from Clerk publicMetadata. */
export async function getRole(): Promise<UserRole | null> {
  const user = await currentUser();
  if (!user) return null;
  return ((user.publicMetadata as SessionMetadata)?.role) ?? null;
}

/**
 * Call in a Server Component or Server Action to enforce a specific role.
 * Redirects to /dashboard if the user doesn't have the required role.
 */
export async function requireRole(role: UserRole): Promise<void> {
  const userRole = await getRole();
  if (userRole !== role) {
    redirect("/dashboard");
  }
}

/**
 * Returns the current session's userId or null.
 * Lightweight check — does not fetch full user object.
 */
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
