"use client";

import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/**
 * Wraps Framer Motion's hook. Returns `true` when the OS-level
 * `prefers-reduced-motion: reduce` setting is on. Components should
 * skip entrance/exit animations and use no-op variants in that case.
 */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}
