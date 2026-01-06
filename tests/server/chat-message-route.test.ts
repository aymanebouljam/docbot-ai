import { POST } from "@/app/api/chats/[chatId]/messages/route";
import { getChatById } from "@/server/chat-repository";
import { createChatSession } from "@/server/chat-service";
import { disconnectDatabase, resetDatabase } from "../support/database";

describe("chat message route", () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    await resetDatabase();
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "A blood pressure of 150/95 is elevated and should be evaluated.",
              },
            },
          ],
        }),
        { status: 200 }
      )
    );
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "test-model";
  });

  afterAll(async () => {
    await disconnectDatabase();
    global.fetch = originalFetch;
  });

  it("persists a posted user message", async () => {
    const chat = await createChatSession();

    const response = await POST(
      new Request("http://localhost/api/chats/messages", {
        method: "POST",
        body: JSON.stringify({
          content: "My blood pressure is 150/95. Is that bad?",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      {
        params: Promise.resolve({ chatId: chat.id }),
      }
    );

    expect(response.status).toBe(201);

    const persistedChat = await getChatById(chat.id);

    expect(persistedChat?.messages).toHaveLength(2);
    expect(persistedChat?.messages[0]?.content).toBe(
      "My blood pressure is 150/95. Is that bad?"
    );
    expect(persistedChat?.messages[0]?.role).toBe("user");
    expect(persistedChat?.messages[1]?.role).toBe("assistant");
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("stores a gentle fallback assistant reply for non-medical prompts", async () => {
    const chat = await createChatSession();

    const response = await POST(
      new Request("http://localhost/api/chats/messages", {
        method: "POST",
        body: JSON.stringify({
          content: "Who won the game yesterday?",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      {
        params: Promise.resolve({ chatId: chat.id }),
      }
    );

    expect(response.status).toBe(201);

    const responseBody = (await response.json()) as {
      classification: string;
      suggestedPrompts: string[];
    };
    const persistedChat = await getChatById(chat.id);

    expect(responseBody.classification).toBe("non_medical");
    expect(responseBody.suggestedPrompts).toHaveLength(3);
    expect(persistedChat?.messages).toHaveLength(2);
    expect(persistedChat?.messages[0]?.content).toBe("Who won the game yesterday?");
    expect(persistedChat?.messages[0]?.role).toBe("user");
    expect(persistedChat?.messages[1]?.role).toBe("assistant");
    expect(persistedChat?.messages[1]?.content).toMatch(
      /specialized in medical and health-related questions/i
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
