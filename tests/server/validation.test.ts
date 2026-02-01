import {
  createMessageRequestSchema,
  MIN_PASSWORD_LENGTH,
  MAX_MESSAGE_LENGTH,
  normalizeStoredContent,
  registerUserRequestSchema,
  updateProfileRequestSchema,
} from "@/server/validation";

describe("request validation", () => {
  it("catches bad message payloads", () => {
    const result = createMessageRequestSchema.safeParse({
      content: 42,
    });

    expect(result.success).toBe(false);
  });

  it("enforces the maximum message length", () => {
    const result = createMessageRequestSchema.safeParse({
      content: "a".repeat(MAX_MESSAGE_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("normalizes stored content", () => {
    expect(normalizeStoredContent("  blood   pressure \r\n high  ")).toBe(
      "blood pressure\nhigh"
    );
  });

  it("validates registration payloads", () => {
    const result = registerUserRequestSchema.safeParse({
      name: "Dr Test",
      email: "doctor@example.com",
      password: "securepass123",
    });

    expect(result.success).toBe(true);
  });

  it("enforces the minimum registration password length", () => {
    const result = registerUserRequestSchema.safeParse({
      name: "Dr Test",
      email: "doctor@example.com",
      password: "a".repeat(MIN_PASSWORD_LENGTH - 1),
    });

    expect(result.success).toBe(false);
  });

  it("validates a profile update payload", () => {
    const result = updateProfileRequestSchema.safeParse({
      name: "Updated User",
      email: "updated@example.com",
      image: null,
    });

    expect(result.success).toBe(true);
  });
});
