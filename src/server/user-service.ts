import {
  type RegisterUserRequest,
  normalizeStoredContent,
} from "@/server/validation";
import { hashPassword, verifyPassword } from "@/server/password";
import { createUser, getUserByEmail } from "@/server/user-repository";

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
