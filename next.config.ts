import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `resend` is an optional runtime dependency used only in security-alerts.ts.
  // Marking it as external tells Turbopack/webpack not to try to bundle it,
  // which silences the "Module not found" build warning while the try/catch
  // in security-alerts.ts handles the case when it isn't installed.
  serverExternalPackages: ["resend"],
};

export default nextConfig;
