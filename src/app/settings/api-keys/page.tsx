import { redirect } from "next/navigation";
import { Code2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { checkAccountTypeAccess } from "@/lib/access";
import { SettingsShell } from "@/components/settings/settings-shell";
import { ApiKeysClient } from "./_client";

export default async function ApiKeysPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const blocked = await checkAccountTypeAccess(["ORGANIZATION", "INTERNAL"]);
  if (blocked) redirect(blocked);

  const keys = await db.apiKey.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });

  const serialized = keys.map((k) => ({
    ...k,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    revokedAt: k.revokedAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }));

  return (
    <SettingsShell>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#B8EB23]" />
            API Keys
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Tokens para integrar BelaBlaze con tus sistemas
          </p>
        </div>

        <ApiKeysClient keys={serialized} />
      </div>
    </SettingsShell>
  );
}
