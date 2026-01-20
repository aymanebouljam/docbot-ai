import { Stethoscope } from "lucide-react";
import { redirect } from "next/navigation";

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
    <main className="grid min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(180deg,_#f7fcfa_0%,_#dcfce7_100%)] px-6 py-12">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2.5rem] border border-emerald-100 bg-white/70 p-8 shadow-sm backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-emerald-600 text-white shadow-sm">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-emerald-600">
                DocBot AI
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                Secure medical workspace
              </h1>
            </div>
          </div>

          <p className="mt-6 max-w-xl text-base leading-8 text-base-content/70">
            Sign in to access your saved conversations and continue prior medical
            chats within your own session.
          </p>

          <div className="mt-8 rounded-[1.75rem] border border-emerald-100 bg-emerald-50/80 p-5">
            <p className="text-sm font-medium text-emerald-700">Demo access</p>
            <p className="mt-2 text-sm leading-7 text-base-content/70">
              Use the configured demo credentials from your environment. If you
              have not changed them, the default email is `demo@docbot.ai`.
            </p>
          </div>
        </section>

        <SignInForm
          callbackUrl={callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/"}
          defaultEmail={process.env.AUTH_EMAIL ?? "demo@docbot.ai"}
        />
      </div>
    </main>
  );
}
