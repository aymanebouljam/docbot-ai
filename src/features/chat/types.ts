export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  suggestedPrompts?: string[];
  tone?: "standard" | "urgent";
};
