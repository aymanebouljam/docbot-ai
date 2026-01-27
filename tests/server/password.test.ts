import { hashPassword, verifyPassword } from "@/server/password";

describe("password helpers", () => {
  it("hashes and verifies passwords", () => {
    const passwordHash = hashPassword("securepass123");

    expect(passwordHash).not.toBe("securepass123");
    expect(verifyPassword("securepass123", passwordHash)).toBe(true);
    expect(verifyPassword("wrong-password", passwordHash)).toBe(false);
  });
});
