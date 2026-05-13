import { Toaster } from "sonner";

/**
 * Onboarding layout — intentionally MINIMAL. No <OnboardingGate>, no sidebar.
 * Anyone with a Clerk session can reach these routes; the page-level checks
 * decide whether to redirect into the wizard or back out to /dashboard.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white dot-grid overflow-hidden relative">
      {/* Ambient brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-[#B8EB23]/[0.06] blur-[120px]"
      />
      <div className="relative z-10">{children}</div>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(20,20,20,0.95)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "13px",
            padding: "12px 14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          },
        }}
      />
    </div>
  );
}
