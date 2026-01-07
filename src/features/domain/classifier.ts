export type DomainClassification = "medical" | "non_medical" | "uncertain";

const MEDICAL_PHRASES = [
  "blood pressure",
  "heart rate",
  "side effect",
  "side effects",
  "lab result",
  "lab results",
  "chest pain",
  "shortness of breath",
  "trouble breathing",
  "feeling dizzy",
  "fever",
  "sore throat",
  "skin rash",
  "panic attack",
  "mental health",
  "blood sugar",
  "liver enzyme",
  "kidney function",
  "thyroid level",
  "pregnancy test",
  "hurt myself",
  "kill myself",
];

const MEDICAL_KEYWORDS = [
  "anemia",
  "anatomy",
  "antibiotic",
  "alt",
  "asthma",
  "biopsy",
  "cbc",
  "cancer",
  "cholesterol",
  "condition",
  "cough",
  "dehydration",
  "diagnosis",
  "diabetes",
  "disease",
  "dizzy",
  "dizziness",
  "dose",
  "dosage",
  "eczema",
  "emergency",
  "fatigue",
  "flu",
  "glucose",
  "headache",
  "health",
  "hemoglobin",
  "hypertension",
  "infection",
  "insulin",
  "lab",
  "labs",
  "medication",
  "medicine",
  "medical",
  "migraine",
  "nausea",
  "nutrition",
  "pain",
  "pharmacy",
  "pregnancy",
  "pressure",
  "rash",
  "scan",
  "seizure",
  "serum",
  "self-harm",
  "symptom",
  "symptoms",
  "suicidal",
  "suicide",
  "therapy",
  "treatment",
  "vaccine",
  "vitamin",
  "wellness",
  "xray",
];

const NON_MEDICAL_PHRASES = [
  "center a div",
  "write code",
  "fix this bug",
  "sql query",
  "stock price",
  "crypto wallet",
  "won the game",
  "who won the match",
  "best laptop",
  "travel itinerary",
  "movie recommendation",
  "css animation",
  "javascript function",
  "python script",
];

const NON_MEDICAL_KEYWORDS = [
  "algorithm",
  "api",
  "bitcoin",
  "browser",
  "career",
  "coding",
  "concert",
  "cricket",
  "crypto",
  "css",
  "dividend",
  "election",
  "finance",
  "flight",
  "football",
  "game",
  "gpu",
  "hotel",
  "investing",
  "javascript",
  "laptop",
  "movie",
  "netflix",
  "nfl",
  "politics",
  "programming",
  "python",
  "react",
  "recipe",
  "restaurant",
  "soccer",
  "sports",
  "sql",
  "stock",
  "tailwind",
  "taxes",
  "travel",
  "typescript",
  "vacation",
];

const NON_MEDICAL_INTENT_PATTERNS = [
  /\b(write|generate|debug|refactor|compile)\b.{0,20}\b(code|function|script|query)\b/i,
  /\b(best|top)\b.{0,20}\b(laptop|phone|camera|gpu|router)\b/i,
  /\bwho won\b.{0,20}\b(game|match|final|election)\b/i,
  /\bplan\b.{0,20}\b(trip|vacation|travel)\b/i,
];

const MEDICAL_INTENT_PATTERNS = [
  /\bwhat (?:is|are|does)\b/i,
  /\bshould i worry\b/i,
  /\bcan .{0,30} cause\b/i,
  /\bis .{0,30} normal\b/i,
];

const TOKEN_PATTERN = /[a-z][a-z0-9-]*/g;

function normalizeInput(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function countKeywordHits(normalizedInput: string, keywords: string[]) {
  const tokens = normalizedInput.match(TOKEN_PATTERN) ?? [];
  const uniqueTokens = new Set(tokens);

  return keywords.reduce((count, keyword) => {
    if (keyword.includes(" ")) {
      return count + (normalizedInput.includes(keyword) ? 1 : 0);
    }

    return count + (uniqueTokens.has(keyword) ? 1 : 0);
  }, 0);
}

function containsPhrase(normalizedInput: string, phrases: string[]) {
  return phrases.some((phrase) => normalizedInput.includes(phrase));
}

export function classifyDomain(input: string): DomainClassification {
  const normalizedInput = normalizeInput(input);

  if (normalizedInput.length === 0) {
    return "uncertain";
  }

  if (
    NON_MEDICAL_INTENT_PATTERNS.some((pattern) => pattern.test(normalizedInput))
  ) {
    return "non_medical";
  }

  const medicalScore =
    countKeywordHits(normalizedInput, MEDICAL_KEYWORDS) +
    (containsPhrase(normalizedInput, MEDICAL_PHRASES) ? 2 : 0) +
    (/\b(my|i have|i'm having|is it normal)\b/.test(normalizedInput) &&
    /\b(pain|fever|rash|pressure|nausea|dizziness|dizzy|anxiety|cough)\b/.test(
      normalizedInput
    )
      ? 2
      : 0);

  const nonMedicalScore =
    countKeywordHits(normalizedInput, NON_MEDICAL_KEYWORDS) +
    (containsPhrase(normalizedInput, NON_MEDICAL_PHRASES) ? 2 : 0);

  if (medicalScore >= 2 && medicalScore >= nonMedicalScore + 1) {
    return "medical";
  }

  if (
    medicalScore >= 1 &&
    nonMedicalScore === 0 &&
    MEDICAL_INTENT_PATTERNS.some((pattern) => pattern.test(normalizedInput))
  ) {
    return "medical";
  }

  if (nonMedicalScore >= 1 && nonMedicalScore >= medicalScore + 1) {
    return "non_medical";
  }

  return "uncertain";
}
