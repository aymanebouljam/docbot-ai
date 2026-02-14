import { getPrismaClient } from "@/lib/prisma";

export async function createUser(input: {
  id?: string;
  name: string;
  email: string;
  passwordHash: string;
  image?: string | null;
}) {
  const prisma = getPrismaClient();

  return prisma.user.create({
    data: {
      ...(input.id ? { id: input.id } : {}),
      name: input.name,
      email: input.email,
      image: input.image ?? null,
      passwordHash: input.passwordHash,
    },
  });
}

export async function getUserByEmail(email: string) {
  const prisma = getPrismaClient();

  return prisma.user.findUnique({
    where: { email },
  });
}

export async function getUserById(id: string) {
  const prisma = getPrismaClient();

  return prisma.user.findUnique({
    where: { id },
  });
}

export async function updateUserProfile(input: {
  userId: string;
  name: string;
  email: string;
  image?: string | null;
  passwordHash?: string;
}) {
  const prisma = getPrismaClient();

  return prisma.user.update({
    where: { id: input.userId },
    data: {
      name: input.name,
      email: input.email,
      image: input.image ?? null,
      ...(input.passwordHash ? { passwordHash: input.passwordHash } : {}),
    },
  });
}
