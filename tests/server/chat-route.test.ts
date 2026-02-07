import { DELETE as DELETE_CHAT, GET as GET_CHAT } from "@/app/api/chats/[chatId]/route";
import { GET, POST } from "@/app/api/chats/route";
import { MAX_CHAT_TITLE_LENGTH } from "@/server/validation";
import { createChatSession } from "@/server/chat-service";
import {
  createTestUser,
  disconnectDatabase,
  resetDatabase,
} from "../support/database";

vi.mock("@/server/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth")>();

  return {
    ...actual,
    getAuthenticatedUser: vi.fn(async () => ({
      id: "test-user-id",
      name: "Test User",
      email: "user@example.com",
    })),
  };
});

describe("chat list route", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("returns chats ordered newest first", async () => {
    const { user } = await createTestUser({
      id: "test-user-id",
      email: "user@example.com",
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

  it("rejects unauthenticated chat list access", async () => {
    const { getAuthenticatedUser } = await import("@/server/auth");

    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("deletes the requested chat", async () => {
    const { user } = await createTestUser({
      id: "test-user-id",
      email: "user@example.com",
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

    const deletedChatResponse = await GET_CHAT(new Request(`http://localhost/api/chats/${chat.id}`), {
      params: Promise.resolve({ chatId: chat.id }),
    });
    const chatsResponse = await GET();
    const chatsBody = (await chatsResponse.json()) as {
      chats: Array<{ id: string }>;
    };

    expect(deletedChatResponse.status).toBe(404);
    expect(chatsBody.chats).toHaveLength(0);
  });
});
