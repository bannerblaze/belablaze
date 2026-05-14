import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NewOrganizationWizard } from "./_client";

/* ──────────────────────────────────────────────────────────────────────
 * "Create new organization" route.
 *
 * Visible only to users whose accountType is ORGANIZATION — i.e. real
 * companies. CREATOR (personal brand) and INTERNAL (BannerBlaze staff)
 * accounts each get one identity and can't spin up parallel orgs.
 *
 * Existing users without an accountType set (legacy FASE 5 data) fall
 * through to /onboarding so they pick a path first.
 * ────────────────────────────────────────────────────────────────────── */

export default async function NewOrganizationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingCompleted) redirect("/onboarding");

  if (user.accountType !== "ORGANIZATION") {
    // PERSON / INTERNAL accounts shouldn't reach this route; bounce them back.
    redirect("/dashboard");
  }

  return <NewOrganizationWizard initialContactName={user.name ?? ""} />;
}
