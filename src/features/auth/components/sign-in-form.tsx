"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

type SignInFormProps = {
  callbackUrl: string;
};

export function SignInForm({
  callbackUrl,
}: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: true,
    });

    if (result?.error) {
      setErrorMessage("The email or password is incorrect.");
      setIsSubmitting(false);
    }
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
            type="email"
            className="w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#111827]"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            type="password"
            className="w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#111827]"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 text-center text-sm text-[#dc2626]" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        className="mt-5 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-[#9ca3af]"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Logging in..." : "Log in"}
      </button>

      <Link
        className="mt-3 flex w-full items-center justify-center rounded-full border border-black/10 px-4 py-3 text-sm font-medium text-[#111827] transition hover:border-black/20 hover:bg-black/[0.03]"
        href="/register"
      >
        Sign up for free
      </Link>

      <p className="mt-5 text-center text-xs leading-5 text-[#6b7280]">
        Use the account you created to access your private medical workspace.
      </p>
    </form>
  );
}
