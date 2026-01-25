import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { getServerAuthSession } from "@/server/auth";

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] | undefined }>;
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

  return (
    <AuthShell
      title="Log in"
      description="Continue to DocBot and pick up your medical conversations where you left off."
    >
        <SignInForm
          callbackUrl={callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/"}
        />
    </AuthShell>
  );
}
