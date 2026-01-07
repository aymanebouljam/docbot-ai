export type SafetyAssessment = {
  level: "urgent" | "standard";
  matchedTriggers: string[];
};

const URGENT_SAFETY_RULES = [
  {
    label: "cardiopulmonary emergency",
    patterns: [/\bchest pain\b/i, /\b(shortness of breath|trouble breathing|can't breathe|cannot breathe)\b/i],
  },
  {
    label: "stroke symptoms",
    patterns: [/\b(face drooping|slurred speech|one-sided weakness|arm weakness|stroke)\b/i],
  },
  {
    label: "self-harm crisis",
    patterns: [/\b(suicidal|suicide|kill myself|hurt myself|self-harm)\b/i],
  },
  {
    label: "anaphylaxis",
    patterns: [/\b(anaphylaxis|allergic reaction|throat swelling|swollen tongue)\b/i, /\b(trouble breathing|can't breathe|cannot breathe)\b/i],
  },
  {
    label: "uncontrolled bleeding",
    patterns: [/\b(uncontrolled bleeding|bleeding heavily|won't stop bleeding)\b/i],
  },
  {
    label: "seizure emergency",
    patterns: [/\b(seizure)\b/i, /\b(not waking up|won't wake up|turning blue|lasting more than five minutes)\b/i],
  },
  {
    label: "infant emergency",
    patterns: [/\b(infant|baby|newborn)\b/i, /\b(fever|not breathing|difficult to wake)\b/i],
  },
];

export function assessMedicalSafety(input: string): SafetyAssessment {
  const matchedTriggers = URGENT_SAFETY_RULES.filter((rule) =>
    rule.patterns.every((pattern) => pattern.test(input))
  ).map((rule) => rule.label);

  if (matchedTriggers.length > 0) {
    return {
      level: "urgent",
      matchedTriggers,
    };
  }

  return {
    level: "standard",
    matchedTriggers: [],
  };
}
