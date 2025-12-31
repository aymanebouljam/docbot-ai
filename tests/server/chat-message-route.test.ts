import { POST } from "@/app/api/chats/[chatId]/messages/route";
import { getChatById } from "@/server/chat-repository";
import { createChatSession } from "@/server/chat-service";
import { disconnectDatabase, resetDatabase } from "../support/database";

describe("chat message route", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
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

    expect(persistedChat?.messages).toHaveLength(1);
    expect(persistedChat?.messages[0]?.content).toBe(
      "My blood pressure is 150/95. Is that bad?"
    );
    expect(persistedChat?.messages[0]?.role).toBe("user");
  });
});
