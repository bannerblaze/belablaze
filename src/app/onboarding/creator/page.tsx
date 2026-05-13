import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CreatorOnboardingWizard } from "./_wizard";

export default async function CreatorOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.onboardingCompleted) redirect("/dashboard");

  return <CreatorOnboardingWizard initialName={user.name} />;
}
