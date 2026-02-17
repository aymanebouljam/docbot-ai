import { buildAuthSetCookieHeader } from "@/server/auth-session";
import { verifyPassword } from "@/server/password";
import { getUserByEmail } from "@/server/user-repository";
import { parseRequestBody, signInRequestSchema } from "@/server/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsedBody = parseRequestBody(signInRequestSchema, body);

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid login payload.",
        details: parsedBody.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { email, password } = parsedBody.data;
  const user = await getUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json(
      { error: "The email or password is incorrect." },
      { status: 401 }
    );
  }

  return Response.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? null,
      },
    },
    {
      headers: {
        "Set-Cookie": buildAuthSetCookieHeader(user.id),
      },
    }
  );
}
