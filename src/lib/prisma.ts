import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const DEFAULT_DATABASE_URL = "file:./dev.db";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    });

    globalForPrisma.prisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.prisma;
}
