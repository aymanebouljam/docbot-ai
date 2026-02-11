import type { ReactNode } from "react";
import Link from "next/link";

import { AuthShowcase } from "@/features/auth/components/auth-showcase";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f4f7f6] text-[#0f172a]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
        <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.28),_transparent_32%),linear-gradient(160deg,_#062f2b_0%,_#0b4b43_50%,_#0f766e_100%)] lg:flex">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_40%,rgba(255,255,255,0.05)_100%)]" />
          <div className="relative flex min-h-screen w-full flex-col px-12 py-10 xl:px-16">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-2xl font-semibold tracking-tight text-white transition hover:text-white/85"
              >
                DocBot
              </Link>
            </div>

            <div className="mt-14 flex flex-1 items-start pt-8">
              <AuthShowcase />
            </div>
          </div>
        </section>

        <section className="flex min-h-screen bg-white">
          <div className="flex min-h-screen w-full flex-col justify-between px-8 py-10 sm:px-12 lg:px-14">
            <div className="lg:hidden">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="text-xl font-semibold tracking-tight text-[#111827] transition hover:text-slate-700"
                >
                  DocBot
                </Link>
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-md flex-1 items-center">
              <div className="w-full">
                <div className="mb-8">
                  <p className="text-sm font-medium text-[#6b7280]">
                    Get started
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] sm:text-[2.2rem]">
                    {title}
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-[#6b7280]">
                    {description}
                  </p>
                </div>

                {children}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
