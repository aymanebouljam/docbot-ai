import { registerUser } from "@/server/user-service";
import {
  parseRequestBody,
  registerUserRequestSchema,
} from "@/server/validation";

function getFirstValidationMessage(
  fieldErrors: Record<string, string[] | undefined>,
  formErrors: string[]
) {
  for (const messages of Object.values(fieldErrors)) {
    if (messages?.[0]) {
      return messages[0];
    }
  }

  return formErrors[0] ?? "Unable to create your account right now.";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsedBody = parseRequestBody(registerUserRequestSchema, body);

  if (!parsedBody.success) {
    const flattened = parsedBody.error.flatten();

    return Response.json(
      {
        error: getFirstValidationMessage(
          flattened.fieldErrors,
          flattened.formErrors
        ),
        details: flattened,
      },
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
