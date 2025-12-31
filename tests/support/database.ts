import { getPrismaClient } from "@/lib/prisma";

export async function resetDatabase() {
  const prisma = getPrismaClient();

  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
}

export async function disconnectDatabase() {
  const prisma = getPrismaClient();

  await prisma.$disconnect();
}
