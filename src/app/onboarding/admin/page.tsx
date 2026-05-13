import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminOnboardingWizard } from "./_wizard";

export default async function AdminOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.onboardingCompleted) redirect("/dashboard");

  return <AdminOnboardingWizard initialEmail={user.email} initialName={user.name} />;
}
