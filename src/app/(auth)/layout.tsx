import { AuthBackground } from "@/components/auth/auth-background";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

/* Auth shell — 2-column cinematic layout.
 *
 *   Desktop (lg+):  [ Form card | Brand panel ]
 *   Mobile:         [ Form card ]  (brand panel hidden)
 *
 * The form card always centers itself within its column; the brand
 * panel sits flush-left in its column so the two compositions are
 * balanced around the viewport center. */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#070708] overflow-hidden">
      <AuthBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-[1180px] grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Form column — centered on mobile, right-aligned on desktop
              so it sits closer to the brand panel for visual balance. */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[440px]">{children}</div>
          </div>

          {/* Brand panel — hidden on mobile, left-aligned in its column */}
          <div className="hidden lg:flex justify-start">
            <AuthBrandPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
