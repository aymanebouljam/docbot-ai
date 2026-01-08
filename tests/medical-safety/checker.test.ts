import { assessMedicalSafety } from "@/features/medical-safety/checker";
import {
  buildUrgentMedicalResponse,
  URGENT_MEDICAL_RESPONSE,
} from "@/features/medical-safety/response";

describe("medical safety checker", () => {
  it("detects urgent cardiopulmonary symptoms", () => {
    const result = assessMedicalSafety("I have crushing chest pain and trouble breathing");

    expect(result.level).toBe("urgent");
    expect(result.matchedTriggers).toContain("cardiopulmonary emergency");
  });

  it("detects self-harm crisis wording", () => {
    const result = assessMedicalSafety("I feel suicidal and want to hurt myself");

    expect(result.level).toBe("urgent");
    expect(result.matchedTriggers).toContain("self-harm crisis");
  });

  it("returns standard for non-urgent medical prompts", () => {
    const result = assessMedicalSafety("What does elevated ALT mean?");

    expect(result.level).toBe("standard");
    expect(result.matchedTriggers).toHaveLength(0);
  });

  it("builds the urgent escalation message", () => {
    expect(buildUrgentMedicalResponse()).toBe(URGENT_MEDICAL_RESPONSE);
    expect(buildUrgentMedicalResponse()).toMatch(/seek immediate medical care now/i);
  });
});
