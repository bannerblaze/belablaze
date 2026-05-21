import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BelaBlaze Player",
  robots: { index: false, follow: false },
};

/* No sidebar, no header, no shell — pure fullscreen output. */
export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {children}
    </div>
  );
}
