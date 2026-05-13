"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store";
import { POLL_INTERVAL_MS, ERROR_BACKOFF_MS } from "@/lib/realtime";
import type { DashboardMetrics } from "@/types";

export function useRealtimeMetrics(initial: DashboardMetrics) {
  const { setMetrics, isRealtime, setRealtime } = useAppStore();
  const errorCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Sync initial server-side metrics into the store on first render
  useEffect(() => {
    setMetrics(initial);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const poll = useCallback(async () => {
    if (!mountedRef.current || !isRealtime) return;
    try {
      const res = await fetch("/api/sse", { cache: "no-store" });
      if (!res.ok) throw new Error("poll failed");
      const data: { metrics: DashboardMetrics } = await res.json();
      if (mountedRef.current) {
        setMetrics(data.metrics);
        errorCountRef.current = 0;
      }
    } catch {
      errorCountRef.current++;
      if (mountedRef.current && errorCountRef.current > 3) setRealtime(false);
    }
  }, [isRealtime, setMetrics, setRealtime]);

  useEffect(() => {
    const schedule = () => {
      const delay = errorCountRef.current > 2 ? ERROR_BACKOFF_MS : POLL_INTERVAL_MS;
      timerRef.current = setTimeout(async () => {
        await poll();
        if (mountedRef.current) schedule();
      }, delay);
    };
    schedule();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [poll]);

  return useAppStore((s) => s.metrics) ?? initial;
}
