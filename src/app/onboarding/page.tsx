import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingSelector } from "./_selector";

/**
 * Onboarding entry point — account type selector.
 *
 * If the user already finished onboarding, bounce them to /dashboard.
 * Otherwise render the 3-card chooser (Empresa / Persona / Admin).
 */
export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.onboardingCompleted) redirect("/dashboard");

  return <OnboardingSelector userEmail={user.email} />;
}
