import {
  DELETE as DELETE_CHAT,
  GET as GET_CHAT,
} from "@/app/api/chats/[chatId]/route";
import { DELETE as DELETE_ALL_CHATS, GET, POST } from "@/app/api/chats/route";
import { MAX_CHAT_TITLE_LENGTH } from "@/server/validation";
import { createChatSession } from "@/server/chat-service";
import {
  createAuthCookieForUser,
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
      email: "local@docbot.app",
    });
    const cookie = createAuthCookieForUser(user.id);
    const firstChat = await createChatSession(user.id, "Earlier chat");
    const secondChat = await createChatSession(user.id, "Later chat");

    expect(firstChat.id).not.toBe(secondChat.id);

    const response = await GET(
      new Request("http://localhost/api/chats", {
        headers: {
          Cookie: cookie,
        },
      })
    );
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
    const { user } = await createTestUser();
    const cookie = createAuthCookieForUser(user.id);
    const response = await POST(
      new Request("http://localhost/api/chats", {
        method: "POST",
        body: JSON.stringify({
          title: 123,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
      })
    );

    expect(response.status).toBe(400);
  });

  it("rejects an overly long create-chat title", async () => {
    const { user } = await createTestUser();
    const cookie = createAuthCookieForUser(user.id);
    const response = await POST(
      new Request("http://localhost/api/chats", {
        method: "POST",
        body: JSON.stringify({
          title: "a".repeat(MAX_CHAT_TITLE_LENGTH + 1),
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
      })
    );

    expect(response.status).toBe(400);
  });

  it("deletes all chats for the authenticated user", async () => {
    const { user } = await createTestUser({
      email: "local@docbot.app",
    });
    const cookie = createAuthCookieForUser(user.id);

    await createChatSession(user.id, "First");
    await createChatSession(user.id, "Second");

    const response = await DELETE_ALL_CHATS(
      new Request("http://localhost/api/chats", {
        method: "DELETE",
        headers: {
          Cookie: cookie,
        },
      })
    );
    const body = (await response.json()) as { deletedCount: number };

    expect(response.status).toBe(200);
    expect(body.deletedCount).toBe(2);

    const chatsResponse = await GET(
      new Request("http://localhost/api/chats", {
        headers: {
          Cookie: cookie,
        },
      })
    );
    const chatsBody = (await chatsResponse.json()) as {
      chats: Array<{ id: string }>;
    };

    expect(chatsBody.chats).toHaveLength(0);
  });

  it("deletes the requested chat", async () => {
    const { user } = await createTestUser({
      email: "local@docbot.app",
    });
    const cookie = createAuthCookieForUser(user.id);
    const chat = await createChatSession(user.id, "Delete me");

    const response = await DELETE_CHAT(
      new Request(`http://localhost/api/chats/${chat.id}`, {
        method: "DELETE",
        headers: {
          Cookie: cookie,
        },
      }),
      { params: Promise.resolve({ chatId: chat.id }) }
    );
    const body = (await response.json()) as {
      chat: { id: string; title: string | null };
    };

    expect(response.status).toBe(200);
    expect(body.chat.id).toBe(chat.id);

    const deletedChatResponse = await GET_CHAT(
      new Request(`http://localhost/api/chats/${chat.id}`, {
        headers: {
          Cookie: cookie,
        },
      }),
      {
        params: Promise.resolve({ chatId: chat.id }),
      }
    );
    const chatsResponse = await GET(
      new Request("http://localhost/api/chats", {
        headers: {
          Cookie: cookie,
        },
      })
    );
    const chatsBody = (await chatsResponse.json()) as {
      chats: Array<{ id: string }>;
    };

    expect(deletedChatResponse.status).toBe(404);
    expect(chatsBody.chats).toHaveLength(0);
  });
});
