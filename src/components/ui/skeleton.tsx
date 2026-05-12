import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "skeleton rounded-lg",
        className
      )}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-4 lg:p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-14 h-5 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-28 h-7 rounded-lg" />
        <Skeleton className="w-40 h-3 rounded" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/[0.04]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className={cn("h-4 rounded", i === 0 ? "w-36" : i === cols - 1 ? "w-14" : "w-24")} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] overflow-hidden">
      <div className="border-b border-white/[0.06] px-4 py-4 flex items-center gap-3">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-3 w-16 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <Skeleton className="h-7 w-32 rounded-lg" />
      </div>
      <div className="relative overflow-hidden rounded-lg" style={{ height }}>
        <Skeleton className="absolute inset-0 rounded-lg" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 px-4 pb-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-white/[0.03] rounded-t-sm"
              style={{ height: `${20 + Math.sin(i * 0.8) * 40 + 30}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3 rounded", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

export function CampaignCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-8 rounded" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-2.5 w-20 rounded" />
          <Skeleton className="h-2.5 w-20 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.04]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="text-center space-y-1.5">
            <Skeleton className="h-4 w-10 mx-auto rounded" />
            <Skeleton className="h-2.5 w-14 mx-auto rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScreenCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] overflow-hidden">
      <div className="h-1 w-full skeleton" />
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
          <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-3 rounded" />
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ClientCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] overflow-hidden">
      <div className="h-0.5 w-full skeleton" />
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.04]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="text-center space-y-1.5">
              <Skeleton className="h-4 w-8 mx-auto rounded" />
              <Skeleton className="h-2.5 w-12 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-3.5 border-b border-white/[0.04] last:border-0">
          <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-3.5 w-4/5 rounded" />
            <Skeleton className="h-3 w-2/5 rounded" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 space-y-6 lg:space-y-8 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 sm:w-64 rounded" />
          <Skeleton className="h-4 w-32 sm:w-48 rounded" />
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <MetricCardSkeleton key={i} />)}
      </div>
      {/* Main chart */}
      <ChartSkeleton height={240} />
      {/* Bottom grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <TableSkeleton cols={4} rows={4} />
        <div className="space-y-5">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
}
