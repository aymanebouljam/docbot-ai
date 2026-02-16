import {
  DELETE as DELETE_CHAT,
  GET as GET_CHAT,
} from "@/app/api/chats/[chatId]/route";
import { DELETE as DELETE_ALL_CHATS, GET, POST } from "@/app/api/chats/route";
import { MAX_CHAT_TITLE_LENGTH } from "@/server/validation";
import { createChatSession } from "@/server/chat-service";
import {
  createTestUser,
  disconnectDatabase,
  resetDatabase,
} from "../support/database";

describe("chat list route", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("returns chats ordered newest first", async () => {
    const { user } = await createTestUser({
      id: "local-docbot-user",
      email: "local@docbot.app",
    });
    const firstChat = await createChatSession(user.id, "Earlier chat");
    const secondChat = await createChatSession(user.id, "Later chat");

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

  it("deletes all chats for the authenticated user", async () => {
    const { user } = await createTestUser({
      id: "local-docbot-user",
      email: "local@docbot.app",
    });

    await createChatSession(user.id, "First");
    await createChatSession(user.id, "Second");

    const response = await DELETE_ALL_CHATS();
    const body = (await response.json()) as { deletedCount: number };

    expect(response.status).toBe(200);
    expect(body.deletedCount).toBe(2);

    const chatsResponse = await GET();
    const chatsBody = (await chatsResponse.json()) as {
      chats: Array<{ id: string }>;
    };

    expect(chatsBody.chats).toHaveLength(0);
  });

  it("deletes the requested chat", async () => {
    const { user } = await createTestUser({
      id: "local-docbot-user",
      email: "local@docbot.app",
    });
    const chat = await createChatSession(user.id, "Delete me");

    const response = await DELETE_CHAT(
      new Request(`http://localhost/api/chats/${chat.id}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ chatId: chat.id }) }
    );
    const body = (await response.json()) as {
      chat: { id: string; title: string | null };
    };

    expect(response.status).toBe(200);
    expect(body.chat.id).toBe(chat.id);

    const deletedChatResponse = await GET_CHAT(
      new Request(`http://localhost/api/chats/${chat.id}`),
      {
        params: Promise.resolve({ chatId: chat.id }),
      }
    );
    const chatsResponse = await GET();
    const chatsBody = (await chatsResponse.json()) as {
      chats: Array<{ id: string }>;
    };

    expect(deletedChatResponse.status).toBe(404);
    expect(chatsBody.chats).toHaveLength(0);
  });
});
