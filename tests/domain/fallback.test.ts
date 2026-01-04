import {
  buildDomainFallbackResponse,
  NON_MEDICAL_FALLBACK_MESSAGE,
  UNCERTAIN_FALLBACK_MESSAGE,
} from "@/features/domain/fallback";

describe("domain fallback responses", () => {
  it("returns the specialized-scope fallback for non-medical prompts", () => {
    const response = buildDomainFallbackResponse("non_medical");

    expect(response.content).toBe(NON_MEDICAL_FALLBACK_MESSAGE);
    expect(response.suggestedPrompts).toHaveLength(3);
  });

  it("returns the reframe fallback for uncertain prompts", () => {
    const response = buildDomainFallbackResponse("uncertain");

    expect(response.content).toBe(UNCERTAIN_FALLBACK_MESSAGE);
    expect(response.suggestedPrompts).toHaveLength(3);
  });
});
