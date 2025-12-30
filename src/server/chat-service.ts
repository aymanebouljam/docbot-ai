import { MessageRole } from "@/generated/prisma/enums";

import {
  createChat,
  getChatById,
  saveMessage,
  type ChatWithMessages,
} from "@/server/chat-repository";

export async function createChatSession(title?: string) {
  return createChat({ title });
}

export async function addMessageToChat(input: {
  chatId: string;
  content: string;
  role: MessageRole;
}) {
  const trimmedContent = input.content.trim();

  if (!trimmedContent) {
    throw new Error("Message content is required.");
  }

  return saveMessage({
    chatId: input.chatId,
    role: input.role,
    content: trimmedContent,
  });
}

export async function addUserMessageToChat(chatId: string, content: string) {
  return addMessageToChat({
    chatId,
    content,
    role: MessageRole.user,
  });
}

export async function loadChat(chatId: string): Promise<ChatWithMessages | null> {
  return getChatById(chatId);
}
