import { addMessageToChat, createChatSession, loadChat } from "@/server/chat-service";
import { MessageRole } from "@/generated/prisma/enums";
import {
  createTestUser,
  disconnectDatabase,
  resetDatabase,
} from "../support/database";

describe("chat history loading", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("reloads chat history from the database in chronological order", async () => {
    const { user } = await createTestUser();
    const chat = await createChatSession(user.id, "Follow-up question");

    await addMessageToChat({
      userId: user.id,
      chatId: chat.id,
      role: MessageRole.user,
      content: "What does elevated ALT mean?",
    });
    await addMessageToChat({
      userId: user.id,
      chatId: chat.id,
      role: MessageRole.assistant,
      content: "It can reflect liver irritation or inflammation.",
    });

    const loadedChat = await loadChat(user.id, chat.id);

    expect(loadedChat?.id).toBe(chat.id);
    expect(loadedChat?.title).toBe("Follow-up question");
    expect(loadedChat?.messages.map((message) => message.content)).toEqual([
      "What does elevated ALT mean?",
      "It can reflect liver irritation or inflammation.",
    ]);
  });
});
