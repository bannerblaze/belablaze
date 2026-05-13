"use client";

import { toast as sonner } from "sonner";

/**
 * Branded toast helpers. Use these instead of importing `toast` from sonner
 * directly — they apply consistent BannerBlaze styling per variant.
 */

type ToastOptions = {
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
};

const baseStyles = {
  background: "rgba(20, 20, 20, 0.95)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "12px",
  color: "#fff",
};

export const toast = {
  success(message: string, opts?: ToastOptions) {
    return sonner.success(message, {
      ...opts,
      style: { ...baseStyles, borderColor: "rgba(34, 197, 94, 0.25)" },
    });
  },
  error(message: string, opts?: ToastOptions) {
    return sonner.error(message, {
      ...opts,
      style: { ...baseStyles, borderColor: "rgba(239, 68, 68, 0.25)" },
    });
  },
  warning(message: string, opts?: ToastOptions) {
    return sonner.warning(message, {
      ...opts,
      style: { ...baseStyles, borderColor: "rgba(245, 158, 11, 0.25)" },
    });
  },
  info(message: string, opts?: ToastOptions) {
    return sonner.info(message, {
      ...opts,
      style: { ...baseStyles, borderColor: "rgba(59, 130, 246, 0.25)" },
    });
  },
  brand(message: string, opts?: ToastOptions) {
    return sonner(message, {
      ...opts,
      style: { ...baseStyles, borderColor: "rgba(184, 235, 35, 0.4)", boxShadow: "0 0 24px rgba(184, 235, 35, 0.08)" },
    });
  },
  promise<T>(
    promise: Promise<T>,
    msgs: { loading: string; success: string | ((data: T) => string); error: string }
  ) {
    return sonner.promise(promise, msgs);
  },
  dismiss(id?: string | number) {
    return sonner.dismiss(id);
  },
};
