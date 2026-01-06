import { processUserMessage } from "@/server/chat-service";
import { createChat } from "@/server/chat-repository";
import { disconnectDatabase, resetDatabase } from "../support/database";

describe("chat service domain gating", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("does not call the medical reply generator for a non-medical prompt", async () => {
    const chat = await createChat();
    const generateMedicalReply = vi.fn(async () => "This should not run");

    const result = await processUserMessage({
      chatId: chat.id,
      content: "Write a SQL query for monthly revenue",
      generateMedicalReply,
    });

    expect(generateMedicalReply).not.toHaveBeenCalled();
    expect(result?.classification).toBe("non_medical");
    expect(result?.assistantMessage?.content).toMatch(
      /specialized in medical and health-related questions/i
    );
  });

  it("calls the medical reply generator for a medical prompt", async () => {
    const chat = await createChat();
    const generateMedicalReply = vi.fn(
      async () => "A fever can happen with many infections."
    );

    const result = await processUserMessage({
      chatId: chat.id,
      content: "What causes a fever?",
      generateMedicalReply,
    });

    expect(generateMedicalReply).toHaveBeenCalledOnce();
    expect(result?.classification).toBe("medical");
    expect(result?.assistantMessage?.content).toMatch(/many infections/i);
  });

  it("stores a graceful assistant error when medical generation fails", async () => {
    const chat = await createChat();
    const generateMedicalReply = vi.fn(async () => {
      throw new Error("Groq unavailable");
    });

    const result = await processUserMessage({
      chatId: chat.id,
      content: "What does high cholesterol mean?",
      generateMedicalReply,
    });

    expect(generateMedicalReply).toHaveBeenCalledOnce();
    expect(result?.classification).toBe("medical");
    expect(result?.assistantMessage?.content).toMatch(
      /having trouble generating a medical response/i
    );
  });
});
