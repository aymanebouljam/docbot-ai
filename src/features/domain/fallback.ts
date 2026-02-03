import { SUGGESTED_MEDICAL_PROMPTS } from "@/features/chat/constants";

export type DomainFallbackResponse = {
  content: string;
  suggestedPrompts: string[];
};

export const PROMPT_INJECTION_FALLBACK_MESSAGE =
  "I can help with medical and health questions, but I can't follow requests to ignore my instructions or change roles. Ask your question directly, and I'll help in a medical context.";

export function buildPromptInjectionFallbackResponse(): DomainFallbackResponse {
  return {
    content: PROMPT_INJECTION_FALLBACK_MESSAGE,
    suggestedPrompts: SUGGESTED_MEDICAL_PROMPTS.slice(0, 3),
  };
}
