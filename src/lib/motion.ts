import type { Transition, Variants } from "framer-motion";

/* ──────────────────────────────────────────────────────────────────────
 * Motion design system — durations, easings, presets
 * Centralizes Framer Motion timing/curves so the entire app feels unified
 * (Linear/Vercel/Raycast vibe). Use these instead of inlining timings.
 * ────────────────────────────────────────────────────────────────────── */

/** Standard durations (seconds). */
export const duration = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  page: 0.35,
  stagger: 0.08,
} as const;

/** Easing curves matching Material 3 + Apple HIG defaults. */
export const easing = {
  out: [0.4, 0, 0.2, 1] as const,         // standard ease-out
  inOut: [0.4, 0, 0.6, 1] as const,        // standard ease-in-out
  spring: [0.16, 1, 0.3, 1] as const,      // soft spring-like (Tailwind ease-out-quad)
  bounce: [0.34, 1.56, 0.64, 1] as const,  // overshoot — use sparingly
} as const;

/** Common transitions. */
export const transitions: Record<string, Transition> = {
  fast: { duration: duration.fast, ease: easing.out },
  normal: { duration: duration.normal, ease: easing.out },
  slow: { duration: duration.slow, ease: easing.out },
  page: { duration: duration.page, ease: easing.spring },
  spring: { type: "spring", stiffness: 320, damping: 30 },
};

/** Reusable variants — pass to <motion.div variants={...}> with initial/animate. */
export const variants = {
  fadeUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: transitions.normal },
    exit: { opacity: 0, y: -4, transition: transitions.fast },
  } satisfies Variants,

  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: transitions.fast },
    exit: { opacity: 0, transition: transitions.fast },
  } satisfies Variants,

  scaleIn: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1, transition: transitions.normal },
    exit: { opacity: 0, scale: 0.96, transition: transitions.fast },
  } satisfies Variants,

  slideRight: {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0, transition: transitions.normal },
    exit: { opacity: 0, x: 8, transition: transitions.fast },
  } satisfies Variants,

  modal: {
    initial: { opacity: 0, scale: 0.95, y: -8 },
    animate: { opacity: 1, scale: 1, y: 0, transition: transitions.normal },
    exit: { opacity: 0, scale: 0.95, y: -8, transition: transitions.fast },
  } satisfies Variants,

  page: {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0, transition: transitions.page },
    exit: { opacity: 0, y: -4, transition: transitions.fast },
  } satisfies Variants,
};

/** Stagger helper: returns variants with delayed appearance. */
export function staggerChild(index: number, stride = duration.stagger): Transition {
  return { duration: duration.normal, delay: index * stride, ease: easing.out };
}

/** Stagger container — children with `variants.fadeUp` will appear in sequence. */
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: duration.stagger,
      delayChildren: 0.05,
    },
  },
};
