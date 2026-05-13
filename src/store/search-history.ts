"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_HISTORY = 8;

interface SearchHistoryState {
  recent: string[];
  add: (query: string) => void;
  clear: () => void;
  remove: (query: string) => void;
}

export const useSearchHistory = create<SearchHistoryState>()(
  persist(
    (set) => ({
      recent: [],
      add: (query) =>
        set((state) => {
          const q = query.trim();
          if (!q || q.length < 2) return state;
          const filtered = state.recent.filter((r) => r.toLowerCase() !== q.toLowerCase());
          return { recent: [q, ...filtered].slice(0, MAX_HISTORY) };
        }),
      remove: (query) =>
        set((state) => ({
          recent: state.recent.filter((r) => r !== query),
        })),
      clear: () => set({ recent: [] }),
    }),
    { name: "belablaze-search-history" }
  )
);
