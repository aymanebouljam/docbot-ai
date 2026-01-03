import { SUGGESTED_MEDICAL_PROMPTS } from "@/features/chat/constants";
import type { DomainClassification } from "@/features/domain/classifier";

export type DomainFallbackResponse = {
  content: string;
  suggestedPrompts: string[];
};

export const NON_MEDICAL_FALLBACK_MESSAGE =
  "I'm specialized in medical and health-related questions, so I can't help with that topic here. You can ask me about symptoms, conditions, medications, treatments, prevention, or lab results.";

export const UNCERTAIN_FALLBACK_MESSAGE =
  "I'm focused on medical and health topics. If you want, try rephrasing your question in a medical context, and I'll help.";

export function isBlockedDomainClassification(
  classification: DomainClassification
) {
  return classification === "non_medical" || classification === "uncertain";
}

export function buildDomainFallbackResponse(
  classification: DomainClassification
): DomainFallbackResponse {
  return {
    content:
      classification === "non_medical"
        ? NON_MEDICAL_FALLBACK_MESSAGE
        : UNCERTAIN_FALLBACK_MESSAGE,
    suggestedPrompts: SUGGESTED_MEDICAL_PROMPTS.slice(0, 3),
  };
}
