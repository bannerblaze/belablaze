import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { SignUpForm } from "./_form";

export const metadata = { title: "Crear cuenta" };

export default async function SignUpPage({
  params,
}: {
  params: Promise<Record<string, string | string[]>>;
}) {
  const p = await params;
  const segments = p["sign-up"];
  const pathSegments = Array.isArray(segments)
    ? segments
    : segments
    ? [segments]
    : [];

  if (pathSegments[0] === "sso-callback") {
    return <AuthenticateWithRedirectCallback />;
  }

  return <SignUpForm />;
}
