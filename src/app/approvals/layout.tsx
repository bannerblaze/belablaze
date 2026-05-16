import { redirect } from "next/navigation";
import { checkPlatformStaffAccess } from "@/lib/access";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const blocked = await checkPlatformStaffAccess("/dashboard");
  if (blocked) redirect(blocked);

  return <DashboardShell>{children}</DashboardShell>;
}
