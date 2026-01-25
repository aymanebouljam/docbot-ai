import { registerUser } from "@/server/user-service";
import {
  parseRequestBody,
  registerUserRequestSchema,
} from "@/server/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsedBody = parseRequestBody(registerUserRequestSchema, body);

  if (!parsedBody.success) {
    return Response.json(
      { error: "Invalid registration payload.", details: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const user = await registerUser(parsedBody.data);

  if (!user) {
    return Response.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

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
