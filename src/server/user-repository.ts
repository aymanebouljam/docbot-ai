import { getPrismaClient } from "@/lib/prisma";

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const prisma = getPrismaClient();

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
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
