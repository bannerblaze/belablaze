/* Static cinematic auth background — pure CSS/SVG, no JS.
 *
 * Layers (back → front):
 *   1. Masked dot grid (subtle tech texture)
 *   2. Top-right radial brand glow (the "sun") + slow breathing
 *   3. Bottom-left counter-glow (balances composition)
 *   4. Diagonal hairlines on the right (motion direction cue)
 *   5. Two orbital arcs (light trails sweeping in from top-right)
 *   6. Outer vignette (depth + focuses center)
 *
 * Adapts gracefully to mobile — glows reposition via percentage
 * offsets so they stay visible without dominating the small canvas. */

export function AuthBackground() {
  return (
    <>
      {/* 1. Subtle dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
        }}
      />

      {/* 2. Top-right brand glow with breathing animation */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[20%] right-[-25%] sm:right-[-15%] w-[700px] sm:w-[900px] h-[700px] sm:h-[900px] rounded-full animate-[auth-breathe_8s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle, rgba(184,235,35,0.20) 0%, rgba(184,235,35,0.06) 35%, transparent 70%)",
        }}
      />

      {/* 3. Bottom-left counter-glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[20%] left-[-25%] sm:left-[-15%] w-[600px] sm:w-[700px] h-[600px] sm:h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(184,235,35,0.06) 0%, transparent 65%)",
        }}
      />

      {/* 4. Diagonal hairlines — subtle motion cue */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.08]"
        preserveAspectRatio="none"
        viewBox="0 0 1600 1000"
      >
        <defs>
          <linearGradient id="diag-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B8EB23" stopOpacity="0" />
            <stop offset="50%" stopColor="#B8EB23" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#B8EB23" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="900"  y1="-100" x2="1700" y2="600"  stroke="url(#diag-line)" strokeWidth="1" />
        <line x1="1100" y1="-100" x2="1900" y2="600"  stroke="url(#diag-line)" strokeWidth="0.6" />
        <line x1="-100" y1="400"  x2="700"  y2="1100" stroke="url(#diag-line)" strokeWidth="0.6" />
      </svg>

      {/* 5. Orbital arcs */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 w-full h-full"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="orbital-1" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B8EB23" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#B8EB23" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#B8EB23" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orbital-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B8EB23" stopOpacity="0.28" />
            <stop offset="80%" stopColor="#B8EB23" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 1600 0 Q 1100 300, 850 800 T 200 1000"
          fill="none"
          stroke="url(#orbital-1)"
          strokeWidth="1.5"
        />
        <path
          d="M 1600 150 Q 1250 400, 1000 850 T 400 1100"
          fill="none"
          stroke="url(#orbital-2)"
          strokeWidth="1"
        />
      </svg>

      {/* 6. Edge vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </>
  );
}
