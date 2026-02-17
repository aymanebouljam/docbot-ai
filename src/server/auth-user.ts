import { getUserById } from "@/server/user-repository";
import {
  getSessionUserIdFromCookies,
  getSessionUserIdFromRequest,
} from "@/server/auth-session";

export async function getAuthenticatedUserFromRequest(request: Request) {
  const userId = getSessionUserIdFromRequest(request);

  if (!userId) {
    return null;
  }

  return getUserById(userId);
}

export async function getAuthenticatedUser() {
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    return null;
  }

  return getUserById(userId);
}
