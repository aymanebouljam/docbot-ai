"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextParams = new URLSearchParams({
      registered: "1",
      email,
    });

    router.push(`/sign-in?${nextParams.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <div>
          <label className="sr-only" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            type="text"
            className="w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#111827]"
            placeholder="Full name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="sr-only" htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            className="w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#111827]"
            placeholder="Email address"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="sr-only" htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            className="w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#111827]"
            placeholder="Password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-5 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-[#9ca3af]"
      >
        Continue
      </button>

      <Link
        className="mt-3 flex w-full items-center justify-center rounded-full border border-black/10 px-4 py-3 text-sm font-medium text-[#111827] transition hover:border-black/20 hover:bg-black/[0.03]"
        href="/sign-in"
      >
        Log in
      </Link>
    </form>
  );
}
