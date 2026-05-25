import { AuthBackground } from "@/components/auth/auth-background";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

/* Auth shell — responsive cinematic layout.
 *
 *   Mobile  (< lg):  stacked, hero on top, form below
 *   Desktop (≥ lg):  2-col grid, form left, hero right
 *
 * Hero stays visible on both viewports — on mobile it adapts to a
 * centered hero block above the form. Each side breathes vertically. */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#070708] overflow-hidden flex flex-col">
      <AuthBackground />

      <div
        className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-12 py-10 lg:py-12"
        style={{
          paddingTop: "max(2.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="w-full max-w-[1180px] flex flex-col items-center gap-10 lg:grid lg:grid-cols-2 lg:gap-20 lg:items-center">
          {/* Brand hero — order-1 mobile (top), order-2 desktop (right) */}
          <div className="order-1 lg:order-2 w-full flex justify-center lg:justify-start">
            <AuthBrandPanel />
          </div>

          {/* Form card — order-2 mobile (bottom), order-1 desktop (left) */}
          <div className="order-2 lg:order-1 w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-[440px]">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
