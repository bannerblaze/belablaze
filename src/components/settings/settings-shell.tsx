import { getCurrentUser } from "@/lib/auth";
import { getOrgContext } from "@/lib/org-context";
import { getOrgPlan } from "@/lib/limits";
import { isPlatformAdmin } from "@/lib/platform";
import { PLANS, type PlanFeature } from "@/lib/plans";
import { SettingsNav } from "./settings-nav";
import type { AccountType } from "@/types";

/* Server component. Resolves: account type, org plan, the set of enabled
 * features and whether the caller is a platform admin. Hands all of it
 * to the client SettingsNav so feature-gated entries either render as
 * locked teasers (plan-locked) or disappear (accountType-blocked).
 *
 * SUPER_ADMIN bypass: anything on the whitelist sees every entry. */

export async function SettingsShell({ children }: { children: React.ReactNode }) {
  const [user, ctx] = await Promise.all([getCurrentUser(), getOrgContext()]);

  const accountType: AccountType | null = user?.accountType ?? null;
  const isAdmin = isPlatformAdmin(user);

  let availableFeatures: PlanFeature[] = [];
  if (ctx) {
    const plan = await getOrgPlan(ctx.organizationId);
    const features = PLANS[plan].features;
    availableFeatures = (Object.keys(features) as PlanFeature[]).filter((k) => features[k]);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-white">Configuración</h1>
        <p className="text-xs text-white/40 mt-0.5">Gestiona tu organización, equipo, facturación y más</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <SettingsNav
          availableFeatures={availableFeatures}
          accountType={accountType}
          isPlatformAdmin={isAdmin}
        />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
