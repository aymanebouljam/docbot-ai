import type { ChatMessage, PersistedChat } from "@/features/chat/types";
import { URGENT_MEDICAL_RESPONSE } from "@/features/medical-safety/response";

function getTone(content: string): ChatMessage["tone"] {
  return content === URGENT_MEDICAL_RESPONSE ? "urgent" : "standard";
}

export function mapPersistedChatMessages(chat: PersistedChat): ChatMessage[] {
  return chat.messages
    .filter(
      (
        message
      ): message is PersistedChat["messages"][number] & {
        role: "user" | "assistant";
      } => message.role === "user" || message.role === "assistant"
    )
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      tone:
        message.role === "assistant" ? getTone(message.content) : "standard",
    }));
}
