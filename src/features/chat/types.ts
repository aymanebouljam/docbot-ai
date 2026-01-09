export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  suggestedPrompts?: string[];
  tone?: "standard" | "urgent";
};

export type PersistedChat = {
  id: string;
  title: string | null;
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
  }>;
};
