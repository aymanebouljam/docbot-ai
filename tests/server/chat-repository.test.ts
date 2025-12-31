import { MessageRole } from "@/generated/prisma/enums";
import { getPrismaClient } from "@/lib/prisma";
import {
  createChat,
  deleteChat,
  getChatById,
  saveMessage,
} from "@/server/chat-repository";
import { disconnectDatabase, resetDatabase } from "../support/database";

describe("chat repository", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("creates a chat", async () => {
    const chat = await createChat({ title: "Anemia questions" });

    expect(chat.id).toEqual(expect.any(String));
    expect(chat.title).toBe("Anemia questions");
  });

  it("saves a message", async () => {
    const chat = await createChat();

    const message = await saveMessage({
      chatId: chat.id,
      role: MessageRole.user,
      content: "What are the symptoms of anemia?",
    });

    expect(message).not.toBeNull();
    expect(message?.chatId).toBe(chat.id);
    expect(message?.role).toBe(MessageRole.user);
  });

  it("fetches a chat with messages ordered oldest to newest", async () => {
    const chat = await createChat();

    const firstMessage = await saveMessage({
      chatId: chat.id,
      role: MessageRole.user,
      content: "First question",
    });
    const secondMessage = await saveMessage({
      chatId: chat.id,
      role: MessageRole.assistant,
      content: "Second answer",
    });

    const persistedChat = await getChatById(chat.id);

    expect(persistedChat?.messages.map((message) => message.id)).toEqual([
      firstMessage?.id,
      secondMessage?.id,
    ]);
  });

  it("deletes related messages when a chat is deleted", async () => {
    const prisma = getPrismaClient();
    const chat = await createChat();

    await saveMessage({
      chatId: chat.id,
      role: MessageRole.user,
      content: "Delete me with the chat",
    });

    await deleteChat(chat.id);

    const persistedChat = await getChatById(chat.id);
    const messageCount = await prisma.message.count({
      where: { chatId: chat.id },
    });

    expect(persistedChat).toBeNull();
    expect(messageCount).toBe(0);
  });
});
