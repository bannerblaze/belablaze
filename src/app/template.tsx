"use client";

import { motion } from "framer-motion";
import { duration, easing } from "@/lib/motion";

/**
 * Global page transition wrapper. Next.js re-mounts this on every route
 * change, so children get a fresh fade. We keep movement minimal (opacity
 * only) to avoid disrupting elements that own their own entrance animations
 * (sidebar, modals, dashboard staggers).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: duration.normal, ease: easing.out }}
    >
      {children}
    </motion.div>
  );
}
