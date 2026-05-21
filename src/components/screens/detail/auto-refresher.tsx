"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Silently calls router.refresh() on a fixed interval to keep
 *  server-rendered data current without a full navigation. */
export function AutoRefresher({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
