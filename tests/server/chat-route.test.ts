import { GET } from "@/app/api/chats/route";
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
});
