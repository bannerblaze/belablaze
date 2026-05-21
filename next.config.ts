import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `resend` is an optional runtime dependency used only in security-alerts.ts.
  // Marking it as external tells Turbopack/webpack not to try to bundle it,
  // which silences the "Module not found" build warning while the try/catch
  // in security-alerts.ts handles the case when it isn't installed.
  // Keep large server-only packages out of the Turbopack/webpack bundle.
  // AWS SDK v3 uses dynamic require() internally; bundling it causes issues.
  serverExternalPackages: [
    "resend",
    "@aws-sdk/client-s3",
    "@aws-sdk/lib-storage",
    "@aws-sdk/s3-request-presigner",
    "@smithy/node-http-handler",
  ],
};

export default nextConfig;
