import { redirect } from "next/navigation";
import { Palette } from "lucide-react";
import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { checkEnterpriseAccess } from "@/lib/limits";
import { SettingsShell } from "@/components/settings/settings-shell";
import { BrandingClient } from "./_client";

export default async function BrandingPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const blocked = await checkEnterpriseAccess(ctx.organizationId, "customBranding");
  if (blocked) redirect(blocked);

  const org = await db.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { id: true, name: true, logoUrl: true, brandColor: true, website: true, industry: true },
  });
  if (!org) redirect("/onboarding");

  return (
    <SettingsShell>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#B8EB23]" />
            Branding
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Personaliza la identidad de tu organización</p>
        </div>
        <BrandingClient
          name={org.name}
          logoUrl={org.logoUrl ?? null}
          brandColor={org.brandColor ?? null}
          website={org.website ?? null}
          industry={org.industry ?? null}
          canEdit={ctx.role === "OWNER" || ctx.role === "ADMIN"}
        />
      </div>
    </SettingsShell>
  );
}
