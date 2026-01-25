import type { ReactNode } from "react";
import Link from "next/link";
import { Stethoscope } from "lucide-react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f7f7f8] px-6 py-10 text-[#0f172a]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[2rem] border border-black/8 bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:px-8">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-black/10 bg-[#f4fbf9] text-emerald-700">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#111827]">
              DocBot
            </span>
          </div>

          <div className="mb-8 text-center">
            <p className="text-sm font-medium text-[#6b7280]">Get started</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#6b7280]">{description}</p>
          </div>

          {children}

          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-[#6b7280]">
            <Link className="transition hover:text-[#111827]" href="https://openai.com/policies/terms-of-use" target="_blank" rel="noreferrer">
              Terms of use
            </Link>
            <span aria-hidden="true">|</span>
            <Link className="transition hover:text-[#111827]" href="https://openai.com/policies/privacy-policy" target="_blank" rel="noreferrer">
              Privacy policy
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
