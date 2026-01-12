import { classifyDomain } from "@/features/domain/classifier";
import {
  buildDomainFallbackResponse,
  isBlockedDomainClassification,
} from "@/features/domain/fallback";
import { assessMedicalSafety } from "@/features/medical-safety/checker";
import { buildUrgentMedicalResponse } from "@/features/medical-safety/response";
import { MessageRole } from "@/generated/prisma/enums";
import type { MedicalContextMessage } from "@/server/groq";
import { buildChatTitleFromMessage } from "@/server/chat-title";
import { normalizeStoredContent } from "@/server/validation";

import {
  createChat,
  getChatById,
  listChats,
  saveMessage,
  type ChatWithMessages,
  type ChatListItem,
  updateChatTitle,
} from "@/server/chat-repository";

export async function createChatSession(title?: string) {
  return createChat({
    title: title ? normalizeStoredContent(title) : undefined,
  });
}

export async function addMessageToChat(input: {
  chatId: string;
  content: string;
  role: MessageRole;
}) {
  const trimmedContent = input.content.trim();
  const normalizedContent = normalizeStoredContent(trimmedContent);

  if (!normalizedContent) {
    throw new Error("Message content is required.");
  }

  return saveMessage({
    chatId: input.chatId,
    role: input.role,
    content: normalizedContent,
  });
}

export async function addUserMessageToChat(chatId: string, content: string) {
  return addMessageToChat({
    chatId,
    content,
    role: MessageRole.user,
  });
}

type MedicalReplyGenerator = (input: {
  chatId: string;
  content: string;
  history: MedicalContextMessage[];
}) => Promise<string>;

export async function processUserMessage(input: {
  chatId: string;
  content: string;
  generateMedicalReply?: MedicalReplyGenerator;
}) {
  const trimmedContent = input.content.trim();
  const userMessage = await addUserMessageToChat(input.chatId, trimmedContent);

  if (!userMessage) {
    return null;
  }

  const chatAfterUserMessage = await getChatById(input.chatId);

  if (!chatAfterUserMessage) {
    return null;
  }

  const userMessages = chatAfterUserMessage.messages.filter(
    (message) => message.role === "user"
  );

  if (!chatAfterUserMessage.title && userMessages.length === 1) {
    await updateChatTitle({
      chatId: input.chatId,
      title: buildChatTitleFromMessage(trimmedContent),
    });
  }

  const classification = classifyDomain(trimmedContent);

  if (isBlockedDomainClassification(classification)) {
    const fallback = buildDomainFallbackResponse(classification);
    const assistantMessage = await addMessageToChat({
      chatId: input.chatId,
      content: fallback.content,
      role: MessageRole.assistant,
    });

    return {
      classification,
      userMessage,
      assistantMessage,
      suggestedPrompts: fallback.suggestedPrompts,
    };
  }

  const safetyAssessment = assessMedicalSafety(trimmedContent);

  if (safetyAssessment.level === "urgent") {
    const urgentResponse = buildUrgentMedicalResponse();
    const assistantMessage = await addMessageToChat({
      chatId: input.chatId,
      content: urgentResponse,
      role: MessageRole.assistant,
    });

    return {
      classification,
      userMessage,
      assistantMessage,
      suggestedPrompts: [],
      safetyLevel: safetyAssessment.level,
    };
  }

  const history: MedicalContextMessage[] = chatAfterUserMessage.messages
    .filter((message) => message.id !== userMessage.id)
    .filter(
      (message): message is typeof message & { role: "user" | "assistant" } =>
        message.role === "user" || message.role === "assistant"
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  if (!input.generateMedicalReply) {
    return {
      classification,
      userMessage,
      assistantMessage: null,
      suggestedPrompts: [],
      safetyLevel: safetyAssessment.level,
    };
  }

  try {
    const medicalReply = await input.generateMedicalReply({
      chatId: input.chatId,
      content: trimmedContent,
      history,
    });

    const assistantMessage = await addMessageToChat({
      chatId: input.chatId,
      content: medicalReply,
      role: MessageRole.assistant,
    });

    return {
      classification,
      userMessage,
      assistantMessage,
      suggestedPrompts: [],
      safetyLevel: safetyAssessment.level,
    };
  } catch {
    const assistantMessage = await addMessageToChat({
      chatId: input.chatId,
      content:
        "I'm having trouble generating a medical response right now. Please try again in a moment.",
      role: MessageRole.assistant,
    });

    return {
      classification,
      userMessage,
      assistantMessage,
      suggestedPrompts: [],
      safetyLevel: safetyAssessment.level,
    };
  }
}

export async function loadChat(chatId: string): Promise<ChatWithMessages | null> {
  return getChatById(chatId);
}

export async function loadChatList(): Promise<ChatListItem[]> {
  return listChats();
}
