import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isPlatformStaff } from "@/lib/platform";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const isOrgAdmin = user.role === "ADMIN" || user.role === "EXECUTIVE";
  if (!isPlatformStaff(user) && !isOrgAdmin) redirect("/dashboard");

  return <DashboardShell>{children}</DashboardShell>;
}
