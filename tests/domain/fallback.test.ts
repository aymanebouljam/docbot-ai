import {
  buildPromptInjectionFallbackResponse,
  PROMPT_INJECTION_FALLBACK_MESSAGE,
} from "@/features/domain/fallback";

describe("domain fallback responses", () => {
  it("returns the prompt-injection fallback", () => {
    const response = buildPromptInjectionFallbackResponse();

    expect(response.content).toBe(PROMPT_INJECTION_FALLBACK_MESSAGE);
    expect(response.suggestedPrompts).toHaveLength(3);
  });
});
