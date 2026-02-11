import {
  createUnauthorizedResponse,
  getAuthenticatedUser,
} from "@/server/auth";
import { updateAuthenticatedUserProfile } from "@/server/user-service";
import {
  parseRequestBody,
  updateProfileRequestSchema,
} from "@/server/validation";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return createUnauthorizedResponse();
  }

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
    },
  });
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return createUnauthorizedResponse();
  }

  const body = await request.json().catch(() => ({}));
  const parsedBody = parseRequestBody(updateProfileRequestSchema, body);

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid profile payload.",
        details: parsedBody.error.flatten(),
      },
      { status: 400 }
    );
  }

  const result = await updateAuthenticatedUserProfile({
    userId: user.id,
    profile: parsedBody.data,
  });

  if (result.status === "not_found") {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  if (result.status === "email_taken") {
    return Response.json(
      { error: "That email is already in use." },
      { status: 409 }
    );
  }

  if (result.status === "invalid_password") {
    return Response.json(
      { error: "Your current password is incorrect." },
      { status: 400 }
    );
  }

  return Response.json({
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      image: result.user.image ?? null,
    },
  });
}
