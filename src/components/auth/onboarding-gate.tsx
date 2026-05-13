import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Server-side gate mounted at the top of every protected layout.
 * Pre-empts page rendering until the user finishes /onboarding.
 *
 * Three outcomes:
 *   - No Clerk session     → redirect to /sign-in
 *   - Session, no profile  → redirect to /onboarding
 *   - Onboarded user       → render children
 *
 * /onboarding/* routes never mount this gate — they live under
 * src/app/onboarding/layout.tsx which intentionally skips it.
 */
export async function OnboardingGate({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }
  if (!user.onboardingCompleted) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
