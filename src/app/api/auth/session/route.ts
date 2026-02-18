import { getAuthenticatedUserFromRequest } from "@/server/auth-user";

export async function GET(request: Request) {
  const user = await getAuthenticatedUserFromRequest(request);

  if (!user) {
    return Response.json({ authenticated: false });
  }

  return Response.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
    },
  });
}
