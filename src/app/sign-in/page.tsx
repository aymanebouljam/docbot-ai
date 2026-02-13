import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { getServerAuthSession } from "@/server/auth";

type SignInPageProps = {
  searchParams: Promise<{
    callbackUrl?: string | string[] | undefined;
    error?: string | string[] | undefined;
    email?: string | string[] | undefined;
    registered?: string | string[] | undefined;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getServerAuthSession();

  if (session) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const callbackUrl = Array.isArray(resolvedSearchParams.callbackUrl)
    ? resolvedSearchParams.callbackUrl[0]
    : resolvedSearchParams.callbackUrl;
  const email = Array.isArray(resolvedSearchParams.email)
    ? resolvedSearchParams.email[0]
    : resolvedSearchParams.email;
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;
  const registered = Array.isArray(resolvedSearchParams.registered)
    ? resolvedSearchParams.registered[0]
    : resolvedSearchParams.registered;

  return (
    <AuthShell title="Log in" description="Pick up your medical conversations.">
      <SignInForm
        callbackUrl={
          callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/"
        }
        initialEmail={email ?? ""}
        initialErrorMessage={
          error === "CredentialsSignin"
            ? "The email or password is incorrect."
            : null
        }
        registered={registered === "1"}
      />
    </AuthShell>
  );
}
