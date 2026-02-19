import { getPrismaClient } from "@/lib/prisma";
import { createSessionCookieHeader } from "@/server/auth-session";
import { hashPassword } from "@/server/password";

export async function resetDatabase() {
  const prisma = getPrismaClient();

  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.user.deleteMany();
}

export async function disconnectDatabase() {
  const prisma = getPrismaClient();

  await prisma.$disconnect();
}

export async function createTestUser(overrides?: {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
}) {
  const prisma = getPrismaClient();
  const email =
    overrides?.email ??
    `user-${Math.random().toString(36).slice(2, 10)}@example.com`;
  const password = overrides?.password ?? "password123";

  const user = await prisma.user.create({
    data: {
      id: overrides?.id,
      name: overrides?.name ?? "Test User",
      email,
      passwordHash: hashPassword(password),
    },
  });

  return {
    user,
    password,
  };
}

export function createAuthCookieForUser(userId: string) {
  return createSessionCookieHeader(userId);
}
