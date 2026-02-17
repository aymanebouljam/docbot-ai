import { hashPassword } from "@/server/password";
import { createUser, getUserByEmail } from "@/server/user-repository";
import { parseRequestBody, registerRequestSchema } from "@/server/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsedBody = parseRequestBody(registerRequestSchema, body);

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid registration payload.",
        details: parsedBody.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { name, email, password } = parsedBody.data;
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return Response.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const user = await createUser({
    name,
    email,
    passwordHash: hashPassword(password),
  });

  return Response.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
    { status: 201 }
  );
}
