"use client";

import { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SignInFormProps = {
  callbackUrl: string;
  initialEmail?: string;
  initialErrorMessage?: string | null;
  registered?: boolean;
};

export function SignInForm({
  callbackUrl,
  initialEmail = "",
  initialErrorMessage = null,
  registered = false,
}: SignInFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialErrorMessage);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      setErrorMessage("The email or password is incorrect.");
      setIsSubmitting(false);
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <div>
          <label className="sr-only" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#111827]"
            placeholder="Email address"
            defaultValue={initialEmail}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="sr-only" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#111827]"
            placeholder="Password"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {registered && !errorMessage ? (
        <p className="mt-4 text-center text-sm text-emerald-700" role="status">
          You&apos;re all set. Continue to DocBot.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 text-center text-sm text-[#dc2626]" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        {isSubmitting ? "Signing in..." : "Log in"}
      </button>

      <Link
        className="mt-3 flex w-full items-center justify-center rounded-full border border-black/10 px-4 py-3 text-sm font-medium text-[#111827] transition hover:border-black/20 hover:bg-black/[0.03]"
        href="/register"
      >
        Sign up for free
      </Link>

      <p className="mt-5 text-center text-xs leading-5 text-[#6b7280]">
        Continue to your medical workspace.
      </p>
    </form>
  );
}
