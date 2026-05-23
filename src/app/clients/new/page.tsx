import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { NewClientClient } from "./_client";

export default async function NewClientPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  return <NewClientClient />;
}
