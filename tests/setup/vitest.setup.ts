import "@testing-library/jest-dom/vitest";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const TEST_DATABASE_URL = "file:./test.db";
const TEST_DATABASE_PATH = path.join(process.cwd(), "test.db");
const MIGRATIONS_PATH = path.join(process.cwd(), "prisma", "migrations");

const globalForTests = globalThis as typeof globalThis & {
  databasePrepared?: boolean;
};

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.NEXTAUTH_SECRET = "test-nextauth-secret";

if (!globalForTests.databasePrepared) {
  fs.rmSync(TEST_DATABASE_PATH, { force: true });

  const database = new Database(TEST_DATABASE_PATH);
  const migrationDirectories = fs
    .readdirSync(MIGRATIONS_PATH, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  for (const directory of migrationDirectories) {
    const migrationPath = path.join(MIGRATIONS_PATH, directory, "migration.sql");
    const migrationSql = fs.readFileSync(migrationPath, "utf8");

    database.exec(migrationSql);
  }

  database.close();
  globalForTests.databasePrepared = true;
}
