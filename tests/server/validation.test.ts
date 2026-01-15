import {
  createMessageRequestSchema,
  MAX_MESSAGE_LENGTH,
  normalizeStoredContent,
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
});
