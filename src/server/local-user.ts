import { hashPassword } from "@/server/password";
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUserProfile,
} from "@/server/user-repository";
import {
  normalizeStoredContent,
  type UpdateProfileRequest,
} from "@/server/validation";

export const LOCAL_USER_ID = "local-docbot-user";
const LOCAL_USER_NAME = "DocBot User";
const LOCAL_USER_EMAIL = "local@docbot.app";
const LOCAL_USER_PASSWORD = "docbot-local-profile";

export async function ensureLocalUser() {
  const existingLocalUser = await getUserById(LOCAL_USER_ID);

  if (existingLocalUser) {
    return existingLocalUser;
  }

  const existingEmailUser = await getUserByEmail(LOCAL_USER_EMAIL);

  if (existingEmailUser) {
    return existingEmailUser;
  }

  return createUser({
    id: LOCAL_USER_ID,
    name: LOCAL_USER_NAME,
    email: LOCAL_USER_EMAIL,
    passwordHash: hashPassword(LOCAL_USER_PASSWORD),
  });
}

export async function getLocalUserProfile() {
  return ensureLocalUser();
}

export async function updateLocalUserProfile(profile: UpdateProfileRequest) {
  const user = await ensureLocalUser();

  return updateUserProfile({
    userId: user.id,
    name: normalizeStoredContent(profile.name),
    email: profile.email,
    image: profile.image ?? null,
    passwordHash: profile.newPassword
      ? hashPassword(profile.newPassword)
      : undefined,
  });
}
