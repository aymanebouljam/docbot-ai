import { addMessageToChat, createChatSession, loadChat } from "@/server/chat-service";
import { MessageRole } from "@/generated/prisma/enums";
import { disconnectDatabase, resetDatabase } from "../support/database";

describe("chat history loading", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("reloads chat history from the database in chronological order", async () => {
    const chat = await createChatSession("Follow-up question");

    await addMessageToChat({
      chatId: chat.id,
      role: MessageRole.user,
      content: "What does elevated ALT mean?",
    });
    await addMessageToChat({
      chatId: chat.id,
      role: MessageRole.assistant,
      content: "It can reflect liver irritation or inflammation.",
    });

    const loadedChat = await loadChat(chat.id);

    expect(loadedChat?.id).toBe(chat.id);
    expect(loadedChat?.title).toBe("Follow-up question");
    expect(loadedChat?.messages.map((message) => message.content)).toEqual([
      "What does elevated ALT mean?",
      "It can reflect liver irritation or inflammation.",
    ]);
  });
});
