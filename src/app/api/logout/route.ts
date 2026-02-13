import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/server/auth";

function createLogoutResponse(request: Request) {
  const response = NextResponse.redirect(new URL("/sign-in", request.url), {
    status: 303,
  });
  clearSessionCookie(response);
  return response;
}

export async function GET(request: Request) {
  return createLogoutResponse(request);
}

export async function POST(request: Request) {
  return createLogoutResponse(request);
}
