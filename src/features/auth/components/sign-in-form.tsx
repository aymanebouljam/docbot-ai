"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

type SignInFormProps = {
  callbackUrl: string;
  defaultEmail: string;
};

export function SignInForm({
  callbackUrl,
  defaultEmail,
}: SignInFormProps) {
  const [email, setEmail] = useState(defaultEmail);
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
    <form
      className="rounded-[2rem] border border-emerald-100 bg-white/95 p-6 shadow-xl"
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input input-bordered w-full rounded-2xl border-emerald-100 bg-white"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input input-bordered w-full rounded-2xl border-emerald-100 bg-white"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 text-sm text-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        className="btn mt-6 w-full rounded-full border-0 bg-emerald-600 text-white hover:bg-emerald-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
