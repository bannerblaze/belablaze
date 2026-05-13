// Polling intervals for simulated realtime updates
export const POLL_INTERVAL_MS = 30_000;   // normal polling: 30s
export const ACTIVITY_POLL_MS = 60_000;   // activity feed: 60s
export const ERROR_BACKOFF_MS = 120_000;  // on error: 2 min

export type RealtimeSnapshot = {
  metrics: import("@/types").DashboardMetrics;
  timestamp: string;
};
