import { getAuthenticatedUserFromRequest } from "@/server/auth-user";
import {
  getProfileByUserId,
  updateProfileByUserId,
} from "@/server/user-profile";
import {
  parseRequestBody,
  updateProfileRequestSchema,
} from "@/server/validation";

export async function GET(request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromRequest(request);

  if (!authenticatedUser) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await getProfileByUserId(authenticatedUser.id);

  if (!user) {
    return Response.json({ error: "User not found." }, { status: 404 });
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
  const authenticatedUser = await getAuthenticatedUserFromRequest(request);

  if (!authenticatedUser) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
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

  const updateResult = await updateProfileByUserId(
    authenticatedUser.id,
    parsedBody.data
  );

  if (!updateResult.user) {
    return Response.json({ error: updateResult.error }, { status: 400 });
  }

  return Response.json({
    user: {
      id: updateResult.user.id,
      name: updateResult.user.name,
      email: updateResult.user.email,
      image: updateResult.user.image ?? null,
    },
  });
}
