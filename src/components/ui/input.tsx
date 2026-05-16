import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────
 * Input — premium text input primitive.
 *
 * Variants:
 *   - default: filled with subtle border, brand-tinted focus ring
 *   - bare: ghost-style, no border until focus (for inline editors)
 *
 * Sizes: sm (28px) | md (36px) | lg (44px)
 *
 * Accepts an optional `leftIcon` / `rightSlot` for prefix/suffix content.
 * ────────────────────────────────────────────────────────────────────── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "bare";
  inputSize?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    variant = "default",
    inputSize = "md",
    leftIcon,
    rightSlot,
    error = false,
    className,
    disabled,
    ...rest
  },
  ref,
) {
  const sizes = {
    sm: "h-7  text-xs   px-2.5",
    md: "h-9  text-sm   px-3",
    lg: "h-11 text-sm   px-3.5",
  };

  const variantBase = variant === "default"
    ? cn(
        "bg-white/[0.03] border border-white/[0.08]",
        "focus:bg-white/[0.05] focus:border-[#B8EB23]/40",
        "focus:shadow-[0_0_0_3px_rgba(184,235,35,0.12)]",
        error && "border-red-400/40 focus:border-red-400/60 focus:shadow-[0_0_0_3px_rgba(248,113,113,0.15)]",
      )
    : cn(
        "bg-transparent border border-transparent",
        "hover:bg-white/[0.02]",
        "focus:bg-white/[0.04] focus:border-white/[0.08]",
      );

  return (
    <div
      className={cn(
        "relative inline-flex items-center w-full rounded-lg transition-all duration-150",
        variantBase,
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {leftIcon && (
        <span className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none",
          inputSize === "sm" && "left-2.5",
        )}>
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full bg-transparent text-white placeholder-white/25 focus:outline-none",
          sizes[inputSize],
          leftIcon && (inputSize === "sm" ? "pl-7" : "pl-9"),
          rightSlot && "pr-9",
        )}
        {...rest}
      />
      {rightSlot && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 flex items-center">
          {rightSlot}
        </span>
      )}
    </div>
  );
});

/* ────────── Textarea — same look, multiline ────────── */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error = false, className, ...rest }, ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full px-3 py-2.5 rounded-lg resize-y transition-all duration-150",
        "bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-white/25",
        "focus:bg-white/[0.05] focus:border-[#B8EB23]/40",
        "focus:shadow-[0_0_0_3px_rgba(184,235,35,0.12)]",
        "focus:outline-none",
        error && "border-red-400/40 focus:border-red-400/60 focus:shadow-[0_0_0_3px_rgba(248,113,113,0.15)]",
        className,
      )}
      {...rest}
    />
  );
});

/* ────────── Field group: label + input + hint ────────── */

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="block text-[11px] font-semibold text-white/55 uppercase tracking-[0.06em]">
          {label}
          {required && <span className="text-[#B8EB23] ml-1">*</span>}
        </label>
      )}
      {children}
      {(hint || error) && (
        <p className={cn("text-[11px]", error ? "text-red-400" : "text-white/35")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
