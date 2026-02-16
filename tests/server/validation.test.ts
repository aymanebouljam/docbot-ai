import {
  createMessageRequestSchema,
  MIN_PASSWORD_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_USER_NAME_LENGTH,
  normalizeStoredContent,
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

  it("requires the current password when setting a new password", () => {
    const result = updateProfileRequestSchema.safeParse({
      name: "Dr Test",
      email: "doctor@example.com",
      newPassword: "securepass123",
    });

    expect(result.success).toBe(false);
  });

  it("enforces the maximum profile name length", () => {
    const result = updateProfileRequestSchema.safeParse({
      name: "a".repeat(MAX_USER_NAME_LENGTH + 1),
      email: "doctor@example.com",
      currentPassword: "a".repeat(MIN_PASSWORD_LENGTH),
      newPassword: "a".repeat(MIN_PASSWORD_LENGTH),
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
