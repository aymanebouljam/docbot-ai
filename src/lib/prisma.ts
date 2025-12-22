import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }

  return globalForPrisma.prisma;
}
