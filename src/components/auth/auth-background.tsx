/* Static cinematic auth background — pure CSS/SVG, no JS.
 *
 * Layers (back → front):
 *   1. Base black surface
 *   2. Dot grid pattern (very subtle)
 *   3. Top-right radial brand glow (the "sun")
 *   4. Bottom-left radial brand glow (counter-light)
 *   5. Two orbital arcs on the right (light trails)
 *   6. Vignette darkening corners
 *
 * All layers are `pointer-events-none` and `aria-hidden`. */

export function AuthBackground() {
  return (
    <>
      {/* 1. Subtle dot grid — keeps the canvas from feeling flat */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
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

      {/* 2. Top-right brand glow — the cinematic "sun" */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[30%] -right-[15%] w-[900px] h-[900px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(184,235,35,0.18) 0%, rgba(184,235,35,0.06) 35%, transparent 70%)",
        }}
      />

      {/* 3. Bottom-left counter-glow — balances composition */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[25%] -left-[15%] w-[700px] h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(184,235,35,0.05) 0%, transparent 65%)",
        }}
      />

      {/* 4. Orbital arcs — light trails curving in from the top-right */}
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
        {/* Outer arc — sweeping curve from top-right corner */}
        <path
          d="M 1600 0 Q 1100 300, 850 800 T 200 1000"
          fill="none"
          stroke="url(#orbital-1)"
          strokeWidth="1.5"
        />
        {/* Inner arc — tighter parallel curve */}
        <path
          d="M 1600 150 Q 1250 400, 1000 850 T 400 1100"
          fill="none"
          stroke="url(#orbital-2)"
          strokeWidth="1"
        />
      </svg>

      {/* 5. Edge vignette — adds depth, focuses center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </>
  );
}
