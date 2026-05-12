import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { SignInForm } from "./_form";
import { ForgotPasswordForm } from "./_forgot-password-form";

export const metadata = { title: "Iniciar sesión" };

export default async function SignInPage({
  params,
}: {
  params: Promise<Record<string, string | string[]>>;
}) {
  const p = await params;
  const segments = p["sign-in"];
  const pathSegments = Array.isArray(segments)
    ? segments
    : segments
    ? [segments]
    : [];

  if (pathSegments[0] === "sso-callback") {
    return <AuthenticateWithRedirectCallback />;
  }

  if (pathSegments[0] === "forgot-password") {
    return <ForgotPasswordForm />;
  }

  return <SignInForm />;
}
