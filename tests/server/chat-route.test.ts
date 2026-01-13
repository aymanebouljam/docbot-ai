import { GET, POST } from "@/app/api/chats/route";
import { MAX_CHAT_TITLE_LENGTH } from "@/server/validation";
import { createChatSession } from "@/server/chat-service";
import { disconnectDatabase, resetDatabase } from "../support/database";

describe("chat list route", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("returns chats ordered newest first", async () => {
    const firstChat = await createChatSession("Earlier chat");
    const secondChat = await createChatSession("Later chat");

    expect(firstChat.id).not.toBe(secondChat.id);

    const response = await GET();
    const body = (await response.json()) as {
      chats: Array<{ id: string; title: string | null }>;
    };

    expect(response.status).toBe(200);
    expect(body.chats.map((chat) => chat.title)).toEqual([
      "Later chat",
      "Earlier chat",
    ]);
  });

  it("rejects an invalid create-chat payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/chats", {
        method: "POST",
        body: JSON.stringify({
          title: 123,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
    );

    expect(response.status).toBe(400);
  });

  it("rejects an overly long create-chat title", async () => {
    const response = await POST(
      new Request("http://localhost/api/chats", {
        method: "POST",
        body: JSON.stringify({
          title: "a".repeat(MAX_CHAT_TITLE_LENGTH + 1),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
    );

    expect(response.status).toBe(400);
  });
});
