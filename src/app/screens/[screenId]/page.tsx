import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { requireOrgContext } from "@/lib/org-context";
import { getScreenDetails } from "@/services/screen-details.service";
import { ScreenStatusBadge } from "@/components/screens/screen-status-badge";
import { getScreenTypeLabel } from "@/lib/utils";

import { ScreenOverviewCard }  from "@/components/screens/detail/screen-overview-card";
import { ScreenPlaybackCard }  from "@/components/screens/detail/screen-playback-card";
import { ScreenHealthCard }    from "@/components/screens/detail/screen-health-card";
import { ScreenAnalyticsCard } from "@/components/screens/detail/screen-analytics-card";
import { ScreenPlaylistCard }  from "@/components/screens/detail/screen-playlist-card";
import { ScreenControlPanel }  from "@/components/screens/detail/screen-control-panel";
import { ScreenActivityFeed }  from "@/components/screens/detail/screen-activity-feed";
import { AutoRefresher }       from "@/components/screens/detail/auto-refresher";

/* ──────────────────────────────────────────────────────────────────────
 * /screens/[screenId] — Mission Control for a single DOOH screen.
 *
 * Server component: fetches all data in one round-trip via
 * getScreenDetails(). Client components handle interactive actions
 * (copy URL, ping, refresh, control actions).
 *
 * AutoRefresher silently calls router.refresh() every 30s so the
 * server-rendered metrics stay current without a full page reload.
 * ────────────────────────────────────────────────────────────────────── */

interface Props {
  params: Promise<{ screenId: string }>;
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-32 rounded-2xl bg-white/[0.03]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-2xl bg-white/[0.03]" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => <div key={i} className="h-72 rounded-2xl bg-white/[0.03]" />)}
      </div>
    </div>
  );
}

async function ScreenContent({ screenId }: { screenId: string }) {
  const ctx = await requireOrgContext().catch(() => null);
  if (!ctx) redirect("/onboarding");

  const data = await getScreenDetails(screenId);
  if (!data) notFound();

  const isOnline = data.status === "ONLINE";

  return (
    <>
      {/* Auto-refresh every 30 s */}
      <AutoRefresher intervalMs={30_000} />

      {/* ───────── HEADER ───────── */}
      <header className="mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[11px] text-white/35 mb-4">
          <Link href="/screens" className="hover:text-white/60 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Pantallas
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/55 truncate max-w-[200px]">{data.name}</span>
        </div>

        {/* Title row */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                {data.name}
              </h1>
              <ScreenStatusBadge status={data.status as "ONLINE" | "OFFLINE" | "MAINTENANCE" | "RESERVED"} withIcon size="md" />
            </div>

            {/* Meta tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono text-white/50">
                {data.code}
              </span>
              <span className="text-white/20 text-[11px]">·</span>
              <span className="text-[12px] text-white/55">{data.city}</span>
              <span className="text-white/20 text-[11px]">·</span>
              <span className="text-[12px] text-white/55">{getScreenTypeLabel(data.type)}</span>
              <span className="text-white/20 text-[11px]">·</span>
              <span className="text-[12px] font-mono text-white/55">
                {data.resolutionWidth}×{data.resolutionHeight}
              </span>
              <span className="text-white/20 text-[11px]">·</span>
              <span className="text-[12px] text-white/55 capitalize">{data.orientation}</span>
              {isOnline && (
                <>
                  <span className="text-white/20 text-[11px]">·</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B8EB23]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8EB23] animate-pulse" />
                    LIVE
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ───────── GRID LAYOUT ───────── */}
      <div className="space-y-4">
        {/* Row 1 — Overview · Health · Control */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            <ScreenOverviewCard data={data} />
          </div>
          <div className="lg:col-span-3">
            <ScreenHealthCard data={data} />
          </div>
          <div className="lg:col-span-4">
            <ScreenControlPanel data={data} />
          </div>
        </div>

        {/* Row 2 — Playback · Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            <ScreenPlaybackCard data={data} />
          </div>
          <div className="lg:col-span-5">
            <ScreenAnalyticsCard data={data} />
          </div>
        </div>

        {/* Row 3 — Playlist · Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <ScreenPlaylistCard data={data} />
          </div>
          <div className="lg:col-span-4">
            <ScreenActivityFeed data={data} />
          </div>
        </div>
      </div>
    </>
  );
}

export default async function ScreenDetailPage({ params }: Props) {
  const { screenId } = await params;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-7 max-w-[1500px]">
      <Suspense fallback={<Skeleton />}>
        <ScreenContent screenId={screenId} />
      </Suspense>
    </div>
  );
}
