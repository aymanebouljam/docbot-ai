import { processUserMessage } from "@/server/chat-service";
import { createChat, getChatById } from "@/server/chat-repository";
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

  it("passes prior chat context to the medical reply generator for follow-up questions", async () => {
    const chat = await createChat();

    await processUserMessage({
      chatId: chat.id,
      content: "I have had a fever for two days",
      generateMedicalReply: vi.fn(async () => "Fever can happen with infections."),
    });

    const generateMedicalReply = vi.fn(
      async () => "A dry cough alongside fever may suggest a respiratory infection."
    );

    await processUserMessage({
      chatId: chat.id,
      content: "Now I also have a cough and fever. Could that be an infection?",
      generateMedicalReply,
    });

    expect(generateMedicalReply).toHaveBeenCalledOnce();
    expect(generateMedicalReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Now I also have a cough and fever. Could that be an infection?",
        history: [
          {
            role: "user",
            content: "I have had a fever for two days",
          },
          {
            role: "assistant",
            content: "Fever can happen with infections.",
          },
        ],
      })
    );
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

  it("does not call the medical reply generator for urgent prompts", async () => {
    const chat = await createChat();
    const generateMedicalReply = vi.fn(
      async () => "This should not run for urgent cases"
    );

    const result = await processUserMessage({
      chatId: chat.id,
      content: "I have crushing chest pain and can't breathe",
      generateMedicalReply,
    });

    expect(generateMedicalReply).not.toHaveBeenCalled();
    expect(result?.safetyLevel).toBe("urgent");
    expect(result?.assistantMessage?.content).toMatch(
      /seek immediate medical care now/i
    );
  });

  it("blocks a non-medical follow-up even inside an existing medical chat", async () => {
    const chat = await createChat();

    await processUserMessage({
      chatId: chat.id,
      content: "What causes low iron?",
      generateMedicalReply: vi.fn(async () => "Low iron is often caused by blood loss."),
    });

    const generateMedicalReply = vi.fn(async () => "This should not run");

    const result = await processUserMessage({
      chatId: chat.id,
      content: "Who won the game yesterday?",
      generateMedicalReply,
    });

    expect(generateMedicalReply).not.toHaveBeenCalled();
    expect(result?.classification).toBe("non_medical");
    expect(result?.assistantMessage?.content).toMatch(
      /specialized in medical and health-related questions/i
    );
  });

  it("generates and saves a title from the first user message", async () => {
    const chat = await createChat();

    await processUserMessage({
      chatId: chat.id,
      content: "What causes persistent dizziness when I stand up?",
      generateMedicalReply: vi.fn(
        async () => "It can happen with dehydration or low blood pressure."
      ),
    });

    const persistedChat = await getChatById(chat.id);

    expect(persistedChat?.title).toBe(
      "What causes persistent dizziness when I stand up"
    );
  });
});
