import { NextResponse } from "next/server";

import { applySessionCookie, createSessionToken } from "@/server/auth";
import { authenticateUser } from "@/server/user-service";

export const runtime = "nodejs";

function getSafeCallbackUrl(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return "/";
  }

  return value;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const callbackUrl = getSafeCallbackUrl(formData.get("callbackUrl"));
  const email =
    typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  const user =
    email && password ? await authenticateUser({ email, password }) : null;

  if (!user) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("error", "CredentialsSignin");
    signInUrl.searchParams.set("callbackUrl", callbackUrl);

    if (email) {
      signInUrl.searchParams.set("email", email);
    }

    return NextResponse.redirect(signInUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(callbackUrl, request.url), {
    status: 303,
  });
  const sessionToken = await createSessionToken({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
  });

  applySessionCookie(response, sessionToken);

  return response;
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/sign-in", request.url), {
    status: 303,
  });
}
