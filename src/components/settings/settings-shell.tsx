import { getAccessContext } from "@/lib/access";
import { SettingsNav } from "./settings-nav";

/* Server component. Resolves the caller's accountType + whether they
 * are a platform super admin, and feeds them to the client SettingsNav.
 *
 * No plan-feature resolution anymore — the system no longer has
 * per-tier gating; settings nav visibility is purely by accountType
 * with super-admin bypass. */

export async function SettingsShell({ children }: { children: React.ReactNode }) {
  const { accountType, isPlatformAdmin } = await getAccessContext();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-white">Configuración</h1>
        <p className="text-xs text-white/40 mt-0.5">Gestiona tu organización, equipo, facturación y más</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <SettingsNav accountType={accountType} isPlatformAdmin={isPlatformAdmin} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
