import { buildClearAuthSetCookieHeader } from "@/server/auth-session";

export async function POST() {
  return Response.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": buildClearAuthSetCookieHeader(),
      },
    }
  );
}
