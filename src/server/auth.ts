import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

import { getUserById } from "@/server/user-repository";

const SESSION_COOKIE_NAME = "docbot.session-token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
type CookieStore = Awaited<ReturnType<typeof cookies>>;

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type AuthSession = {
  user: SessionUser;
};

function getAuthSecret() {
  return process.env.NEXTAUTH_SECRET ?? "docbot-development-secret";
}

function signValue(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("hex");
}

function encodeSessionPayload(user: SessionUser) {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
      image: user.image ?? null,
    }),
    "utf8"
  ).toString("base64url");

  return `${payload}.${signValue(payload)}`;
}

function decodeSessionPayload(token: string): SessionUser | null {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signValue(payload);

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as {
      id?: unknown;
      name?: unknown;
      email?: unknown;
      image?: unknown;
    };

    if (typeof decoded.id !== "string" || decoded.id.length === 0) {
      return null;
    }

    return {
      id: decoded.id,
      name: typeof decoded.name === "string" ? decoded.name : null,
      email: typeof decoded.email === "string" ? decoded.email : null,
      image: typeof decoded.image === "string" ? decoded.image : null,
    };
  } catch {
    return null;
  }
}

export async function createSessionToken(user: SessionUser) {
  return encodeSessionPayload(user);
}

export function applySessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(0),
  });
}

function getSessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function setSessionCookie(cookieStore: CookieStore, token: string) {
  cookieStore.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

export async function getServerAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const decoded = decodeSessionPayload(token);

  if (!decoded) {
    return null;
  }

  return {
    user: decoded,
  };
}

export async function getRequestAuthSession(
  request: NextRequest
): Promise<AuthSession | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const decoded = decodeSessionPayload(token);

  if (!decoded) {
    return null;
  }

  return {
    user: decoded,
  };
}

export function createUnauthorizedResponse() {
  return Response.json({ error: "Unauthorized." }, { status: 401 });
}

export async function getAuthenticatedUser() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const user = await getUserById(userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  };
}
