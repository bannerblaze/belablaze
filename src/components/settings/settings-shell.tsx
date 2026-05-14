import { getOrgContext } from "@/lib/org-context";
import { getOrgPlan } from "@/lib/limits";
import { PLANS, type PlanFeature } from "@/lib/plans";
import { SettingsNav } from "./settings-nav";

/* Server component. Resolves the current org's plan, derives the set
 * of enabled features, and feeds them to the client-side SettingsNav
 * so feature-gated entries can render as locked teasers. */

export async function SettingsShell({ children }: { children: React.ReactNode }) {
  const ctx = await getOrgContext();
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
        <SettingsNav availableFeatures={availableFeatures} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
