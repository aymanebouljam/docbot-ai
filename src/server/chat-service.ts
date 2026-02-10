import { buildPromptInjectionFallbackResponse } from "@/features/domain/fallback";
import { detectPromptInjection } from "@/features/domain/injection";
import { assessMedicalSafety } from "@/features/medical-safety/checker";
import { buildUrgentMedicalResponse } from "@/features/medical-safety/response";
import { MessageRole } from "@/generated/prisma/enums";
import { buildChatTitleFromMessage } from "@/server/chat-title";
import type { MedicalContextMessage } from "@/server/groq";
import {
  createChat,
  deleteChat,
  deleteAllChats,
  getChatById,
  listChats,
  saveMessage,
  type ChatListItem,
  type ChatWithMessages,
  updateChatTitle,
} from "@/server/chat-repository";
import { normalizeStoredContent } from "@/server/validation";

export async function createChatSession(userId: string, title?: string) {
  return createChat({
    userId,
    title: title ? normalizeStoredContent(title) : undefined,
  });
}

export async function addMessageToChat(input: {
  userId: string;
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
    userId: input.userId,
    chatId: input.chatId,
    role: input.role,
    content: normalizedContent,
  });
}

export async function addUserMessageToChat(
  userId: string,
  chatId: string,
  content: string
) {
  return addMessageToChat({
    userId,
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
  userId: string;
  chatId: string;
  content: string;
  generateMedicalReply?: MedicalReplyGenerator;
}) {
  const trimmedContent = input.content.trim();
  const userMessage = await addUserMessageToChat(
    input.userId,
    input.chatId,
    trimmedContent
  );

  if (!userMessage) {
    return null;
  }

  const chatAfterUserMessage = await getChatById(input.chatId, input.userId);

  if (!chatAfterUserMessage) {
    return null;
  }

  const userMessages = chatAfterUserMessage.messages.filter(
    (message) => message.role === "user"
  );

  if (!chatAfterUserMessage.title && userMessages.length === 1) {
    await updateChatTitle({
      userId: input.userId,
      chatId: input.chatId,
      title: buildChatTitleFromMessage(trimmedContent),
    });
  }

  if (detectPromptInjection(trimmedContent)) {
    const fallback = buildPromptInjectionFallbackResponse();
    const assistantMessage = await addMessageToChat({
      userId: input.userId,
      chatId: input.chatId,
      content: fallback.content,
      role: MessageRole.assistant,
    });

    return {
      guardrail: "prompt_injection" as const,
      userMessage,
      assistantMessage,
      suggestedPrompts: fallback.suggestedPrompts,
    };
  }

  const safetyAssessment = assessMedicalSafety(trimmedContent);

  if (safetyAssessment.level === "urgent") {
    const urgentResponse = buildUrgentMedicalResponse(
      safetyAssessment.category ?? "general_urgent"
    );
    const assistantMessage = await addMessageToChat({
      userId: input.userId,
      chatId: input.chatId,
      content: urgentResponse,
      role: MessageRole.assistant,
    });

    return {
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
      userId: input.userId,
      chatId: input.chatId,
      content: medicalReply,
      role: MessageRole.assistant,
    });

    return {
      userMessage,
      assistantMessage,
      suggestedPrompts: [],
      safetyLevel: safetyAssessment.level,
    };
  } catch {
    const assistantMessage = await addMessageToChat({
      userId: input.userId,
      chatId: input.chatId,
      content:
        "I'm having trouble generating a medical response right now. Please try again in a moment.",
      role: MessageRole.assistant,
    });

    return {
      userMessage,
      assistantMessage,
      suggestedPrompts: [],
      safetyLevel: safetyAssessment.level,
    };
  }
}

export async function loadChat(
  userId: string,
  chatId: string
): Promise<ChatWithMessages | null> {
  return getChatById(chatId, userId);
}

export async function loadChatList(userId: string): Promise<ChatListItem[]> {
  return listChats(userId);
}

export async function deleteChatSession(
  userId: string,
  chatId: string
){
  return deleteChat(chatId, userId);
}

export async function deleteAllChatSessions(userId: string) {
  return deleteAllChats(userId);
}
