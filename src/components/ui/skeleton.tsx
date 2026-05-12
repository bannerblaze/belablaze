import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-r from-[#1a1a1a] via-[#242424] to-[#1a1a1a] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]",
        className
      )}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-16 h-6 rounded-lg" />
      </div>
      <div>
        <Skeleton className="w-24 h-8 rounded-lg" />
        <Skeleton className="w-32 h-3 rounded mt-2" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/[0.04]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className={cn("h-4 rounded", i === 0 ? "w-32" : i === cols - 1 ? "w-16" : "w-24")} />
        </td>
      ))}
    </tr>
  );
}
