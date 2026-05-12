export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
      {/* Ambient glow — top-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[20%] -left-[10%] w-[700px] h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(184,235,35,0.06) 0%, transparent 70%)",
        }}
      />
      {/* Ambient glow — bottom-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(184,235,35,0.04) 0%, transparent 70%)",
        }}
      />
      {/* Dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative z-10 w-full px-4">{children}</div>
    </div>
  );
}
