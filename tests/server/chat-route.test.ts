import { GET, POST } from "@/app/api/chats/route";
import { MAX_CHAT_TITLE_LENGTH } from "@/server/validation";
import { createChatSession } from "@/server/chat-service";
import { disconnectDatabase, resetDatabase } from "../support/database";

vi.mock("@/server/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth")>();

  return {
    ...actual,
    getServerAuthSession: vi.fn(async () => ({
      user: {
        name: "Demo User",
        email: "demo@docbot.ai",
      },
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

  it("rejects unauthenticated chat list access", async () => {
    const { getServerAuthSession } = await import("@/server/auth");

    vi.mocked(getServerAuthSession).mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });
});
