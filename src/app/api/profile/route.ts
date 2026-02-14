import {
  getLocalUserProfile,
  updateLocalUserProfile,
} from "@/server/local-user";
import {
  parseRequestBody,
  updateProfileRequestSchema,
} from "@/server/validation";

export async function GET() {
  const user = await getLocalUserProfile();

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

  const user = await updateLocalUserProfile(parsedBody.data);

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
    },
  });
}
