import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CompanyOnboardingWizard } from "./_wizard";

export default async function CompanyOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.onboardingCompleted) redirect("/dashboard");

  return <CompanyOnboardingWizard initialName={user.name} />;
}
