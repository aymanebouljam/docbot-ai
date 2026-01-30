"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Camera, ChevronLeft } from "lucide-react";
import Link from "next/link";

type ProfileFormProps = {
  initialUser: {
    name: string;
    email: string;
    image: string | null;
  };
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileForm({ initialUser }: ProfileFormProps) {
  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email);
  const [image, setImage] = useState<string | null>(initialUser.image);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials = useMemo(() => getInitials(name || initialUser.name), [initialUser.name, name]);

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please choose an image file.");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Unable to read image."));
      reader.readAsDataURL(file);
    });

    setImage(dataUrl);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        image,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          user?: { name: string; email: string; image: string | null };
        }
      | null;

    if (!response.ok || !payload?.user) {
      setErrorMessage(payload?.error ?? "Unable to update your profile.");
      setIsSubmitting(false);
      return;
    }

    setName(payload.user.name);
    setEmail(payload.user.email);
    setImage(payload.user.image);
    setCurrentPassword("");
    setNewPassword("");
    setSuccessMessage("Profile updated.");
    setIsSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_rgba(236,253,245,0.78)_0%,_rgba(255,255,255,0.96)_32%,_rgba(236,253,245,0.72)_100%)] px-6 py-8 text-base-content">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to chats
            </Link>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Profile
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Update your photo, name, email, and password.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <section className="rounded-[2rem] border border-emerald-100 bg-white/95 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="relative h-32 w-32 overflow-hidden rounded-[2rem] border border-emerald-100 bg-emerald-50">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt="Profile photo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl font-semibold text-emerald-700">
                      {initials || "DB"}
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>

              <p className="mt-5 text-lg font-semibold text-slate-900">{name}</p>
              <p className="mt-1 text-sm text-slate-500">{email}</p>

              {image ? (
                <button
                  type="button"
                  className="mt-5 rounded-full border border-base-200 px-4 py-2 text-sm transition hover:bg-base-200"
                  onClick={() => setImage(null)}
                >
                  Remove photo
                </button>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-emerald-100 bg-white/95 p-6 shadow-sm sm:p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Name
                  </span>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </span>
                  <input
                    type="email"
                    className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/60 p-5">
                <h2 className="text-base font-semibold text-slate-900">
                  Change password
                </h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Current password
                    </span>
                    <input
                      type="password"
                      className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      New password
                    </span>
                    <input
                      type="password"
                      className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                  </label>
                </div>
              </div>

              {errorMessage ? (
                <p className="text-sm text-error" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              {successMessage ? (
                <p className="text-sm text-emerald-700" role="status">
                  {successMessage}
                </p>
              ) : null}

              <button
                type="submit"
                className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save changes"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
