import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { listMedia, getMediaStats } from "@/actions/media";
import { MediaClient } from "./_client";

const R2_BASE = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

function resolveUrl(url: string, storageKey: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${R2_BASE}/${storageKey}`;
}

export default async function MediaPage() {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const [assets, stats] = await Promise.all([
    listMedia(),
    getMediaStats(),
  ]);

  return (
    <MediaClient
      canUpload={true}
      canDelete={true}
      stats={stats}
      assets={assets.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        url: resolveUrl(a.url, a.storageKey),
        thumbnailUrl: a.thumbnailUrl ? resolveUrl(a.thumbnailUrl, a.storageKey) : null,
        size: a.size,
        mimeType: a.mimeType,
        createdAt: a.createdAt.toISOString(),
        uploadedBy: { name: a.uploadedBy.name, avatar: a.uploadedBy.avatar },
      }))}
    />
  );
}
