import {
  type RegisterUserRequest,
  type UpdateProfileRequest,
  normalizeStoredContent,
} from "@/server/validation";
import { hashPassword, verifyPassword } from "@/server/password";
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUserProfile,
} from "@/server/user-repository";

export async function registerUser(input: RegisterUserRequest) {
  const normalizedEmail = input.email.toLowerCase();
  const normalizedName = normalizeStoredContent(input.name);
  const passwordHash = hashPassword(input.password);

  try {
    return await createUser({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return null;
    }

    throw error;
  }
}

export async function authenticateUser(input: {
  email: string;
  password: string;
}) {
  const user = await getUserByEmail(input.email.toLowerCase());

  if (!user) {
    return null;
  }

  if (!verifyPassword(input.password, user.passwordHash)) {
    return null;
  }

  return user;
}

export async function getUserProfile(userId: string) {
  return getUserById(userId);
}

export async function updateAuthenticatedUserProfile(input: {
  userId: string;
  profile: UpdateProfileRequest;
}) {
  const user = await getUserById(input.userId);

  if (!user) {
    return { status: "not_found" as const };
  }

  if (user.email !== input.profile.email) {
    const existingUser = await getUserByEmail(input.profile.email);

    if (existingUser && existingUser.id !== user.id) {
      return { status: "email_taken" as const };
    }
  }

  let passwordHash: string | undefined;

  if (input.profile.newPassword) {
    if (
      !input.profile.currentPassword ||
      !verifyPassword(input.profile.currentPassword, user.passwordHash)
    ) {
      return { status: "invalid_password" as const };
    }

    passwordHash = hashPassword(input.profile.newPassword);
  }

  const updatedUser = await updateUserProfile({
    userId: user.id,
    name: normalizeStoredContent(input.profile.name),
    email: input.profile.email,
    image: input.profile.image ?? null,
    passwordHash,
  });

  return {
    status: "updated" as const,
    user: updatedUser,
  };
}
