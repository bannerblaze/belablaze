import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { can } from "@/lib/rbac";
import { listMedia, getMediaStats } from "@/actions/media";
import { MediaClient } from "./_client";

export default async function MediaPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");
  if (!can(ctx.role, "media:view")) redirect("/dashboard");

  const [assets, stats] = await Promise.all([
    listMedia(),
    getMediaStats(),
  ]);

  return (
    <MediaClient
      canUpload={can(ctx.role, "media:upload")}
      canDelete={can(ctx.role, "media:delete")}
      stats={stats}
      assets={assets.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        url: a.url,
        thumbnailUrl: a.thumbnailUrl,
        size: a.size,
        mimeType: a.mimeType,
        createdAt: a.createdAt.toISOString(),
        uploadedBy: { name: a.uploadedBy.name, avatar: a.uploadedBy.avatar },
      }))}
    />
  );
}
