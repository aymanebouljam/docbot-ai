import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "docbot_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_DEV_SECRET = "docbot-dev-session-secret";

type SessionPayload = {
  userId: string;
  exp: number;
};

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET ?? DEFAULT_DEV_SECRET;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function decodeSessionToken(token: string): SessionPayload | null {
  const [payloadBase64, signature] = token.split(".");

  if (!payloadBase64 || !signature) {
    return null;
  }

  const expectedSignature = sign(payloadBase64);
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (expectedSignatureBuffer.length !== signatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedSignatureBuffer, signatureBuffer)) {
    return null;
  }

  try {
    const parsedPayload = JSON.parse(fromBase64Url(payloadBase64)) as SessionPayload;

    if (!parsedPayload.userId || typeof parsedPayload.exp !== "number") {
      return null;
    }

    if (Date.now() >= parsedPayload.exp) {
      return null;
    }

    return parsedPayload;
  } catch {
    return null;
  }
}

function getCookieValueFromHeader(request: Request, cookieName: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookieParts = cookieHeader.split(";").map((part) => part.trim());
  const matchingCookie = cookieParts.find((part) =>
    part.startsWith(`${cookieName}=`)
  );

  if (!matchingCookie) {
    return null;
  }

  return matchingCookie.slice(cookieName.length + 1);
}

export function createSessionToken(userId: string) {
  const payload: SessionPayload = {
    userId,
    exp: Date.now() + SESSION_DURATION_SECONDS * 1000,
  };
  const payloadBase64 = toBase64Url(JSON.stringify(payload));
  const signature = sign(payloadBase64);

  return `${payloadBase64}.${signature}`;
}

export function createSessionCookieHeader(userId: string) {
  return `${SESSION_COOKIE_NAME}=${createSessionToken(userId)}`;
}

export function buildAuthSetCookieHeader(userId: string) {
  return `${SESSION_COOKIE_NAME}=${createSessionToken(userId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function buildClearAuthSetCookieHeader() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function getSessionUserIdFromRequest(request: Request) {
  const token = getCookieValueFromHeader(request, SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  return decodeSessionToken(token)?.userId ?? null;
}

export async function getSessionUserIdFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return decodeSessionToken(token)?.userId ?? null;
}
