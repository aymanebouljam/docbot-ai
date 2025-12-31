import { PrismaClient } from "@/generated/prisma/client";

import { getPrismaClient } from "@/lib/prisma";

describe("prisma client", () => {
  it("can be imported in test context", () => {
    expect(typeof PrismaClient).toBe("function");
    expect(typeof getPrismaClient).toBe("function");
  });
});
