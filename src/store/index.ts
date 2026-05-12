import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { User, Notification, DashboardMetrics } from "@/types";

interface AppState {
  user: User | null;
  sidebarCollapsed: boolean;
  notifications: Notification[];
  unreadCount: number;
  metrics: DashboardMetrics | null;
  isRealtime: boolean;
  commandOpen: boolean;

  setUser: (user: User | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  setMetrics: (metrics: DashboardMetrics) => void;
  setRealtime: (enabled: boolean) => void;
  setCommandOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        sidebarCollapsed: false,
        notifications: [],
        unreadCount: 0,
        metrics: null,
        isRealtime: true,
        commandOpen: false,

        setUser: (user) => set({ user }),
        toggleSidebar: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }),
        addNotification: (notification) =>
          set((state) => {
            const newNotif: Notification = {
              ...notification,
              id: crypto.randomUUID(),
              read: false,
              createdAt: new Date().toISOString(),
            };
            return {
              notifications: [newNotif, ...state.notifications].slice(0, 50),
              unreadCount: state.unreadCount + 1,
            };
          }),
        markNotificationRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          })),
        markAllRead: () =>
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          })),
        setMetrics: (metrics) => set({ metrics }),
        setRealtime: (enabled) => set({ isRealtime: enabled }),
        setCommandOpen: (open) => set({ commandOpen: open }),
      }),
      {
        name: "belablaze-store",
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          isRealtime: state.isRealtime,
        }),
      }
    )
  )
);
