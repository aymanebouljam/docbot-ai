import { hashPassword, verifyPassword } from "@/server/password";
import { getUserById, updateUserProfile } from "@/server/user-repository";
import {
  normalizeStoredContent,
  type UpdateProfileRequest,
} from "@/server/validation";

export async function getProfileByUserId(userId: string) {
  return getUserById(userId);
}

export async function updateProfileByUserId(
  userId: string,
  profile: UpdateProfileRequest
) {
  const existingUser = await getUserById(userId);

  if (!existingUser) {
    return {
      error: "User not found." as const,
      user: null,
    };
  }

  if (profile.newPassword) {
    const passwordMatches = profile.currentPassword
      ? verifyPassword(profile.currentPassword, existingUser.passwordHash)
      : false;

    if (!passwordMatches) {
      return {
        error: "Current password is incorrect." as const,
        user: null,
      };
    }
  }

  const updatedUser = await updateUserProfile({
    userId: existingUser.id,
    name: normalizeStoredContent(profile.name),
    email: profile.email,
    image: profile.image ?? null,
    passwordHash: profile.newPassword
      ? hashPassword(profile.newPassword)
      : undefined,
  });

  return {
    error: null,
    user: updatedUser,
  };
}
