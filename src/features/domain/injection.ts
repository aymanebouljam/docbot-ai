const INJECTION_PHRASES = [
  "ignore previous instructions",
  "ignore all previous instructions",
  "forget previous instructions",
  "forget all previous instructions",
  "disregard previous instructions",
  "bypass your instructions",
  "override your instructions",
  "reveal your system prompt",
  "show your system prompt",
  "developer message",
  "system message",
  "act as a",
  "you are now",
  "jailbreak",
];

const INJECTION_PATTERNS = [
  /\b(ignore|forget|disregard|override|bypass)\b.{0,40}\b(instruction|prompt|rule|policy)\b/i,
  /\b(show|reveal|print|display)\b.{0,40}\b(system prompt|developer message|hidden instructions?)\b/i,
  /\byou are now\b.{0,60}\b(movie critic|travel agent|software engineer|comedian|anything)\b/i,
  /\bact as\b.{0,60}\b(movie critic|travel agent|developer|financial advisor)\b/i,
];

function normalizeInput(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

export function detectPromptInjection(input: string) {
  const normalizedInput = normalizeInput(input);

  if (!normalizedInput) {
    return false;
  }

  return (
    INJECTION_PHRASES.some((phrase) => normalizedInput.includes(phrase)) ||
    INJECTION_PATTERNS.some((pattern) => pattern.test(normalizedInput))
  );
}
