const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_TIMEOUT_MS = 15_000;

const MEDICAL_SYSTEM_PROMPT = `You are DocBot AI, a medical educational assistant.

Rules:
- Answer only medical and health-related questions.
- If a request is not medical or health-related, do not answer it directly. Instead, give a brief, friendly redirect back to supported medical topics.
- Be concise, clear, and honest about uncertainty.
- Do not claim to diagnose with certainty or replace a clinician.
- Avoid unsafe instructions or dangerous dosing advice.
- Encourage urgent in-person care for severe or worsening symptoms, especially trouble breathing, chest pain, confusion, severe bleeding, or loss of consciousness.
- Use structured explanations when useful.
- If information is uncertain, say so plainly.`;

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type MedicalContextMessage = {
  role: "user" | "assistant";
  content: string;
};

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

export class GroqError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GroqError";
  }
}

export function buildMedicalSystemPrompt() {
  return MEDICAL_SYSTEM_PROMPT;
}

const MAX_CONTEXT_MESSAGES = 8;

export function buildMedicalConversationMessages(input: {
  prompt: string;
  history?: MedicalContextMessage[];
}) {
  const history = input.history?.slice(-MAX_CONTEXT_MESSAGES) ?? [];

  return [
    {
      role: "system",
      content: buildMedicalSystemPrompt(),
    },
    ...history,
    {
      role: "user",
      content: input.prompt,
    },
  ] satisfies GroqMessage[];
}

export async function generateMedicalAnswer(input: {
  prompt: string;
  history?: MedicalContextMessage[];
  signal?: AbortSignal;
}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new GroqError("GROQ_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  if (input.signal) {
    input.signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  const messages = buildMedicalConversationMessages({
    prompt: input.prompt,
    history: input.history,
  });

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL,
          messages,
          temperature: 0.2,
        }),
        signal: controller.signal,
      }
    );

    const data = (await response.json()) as GroqChatCompletionResponse;

    if (!response.ok) {
      throw new GroqError(data.error?.message ?? "Groq request failed.");
    }

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new GroqError("Groq returned an empty response.");
    }

    return content;
  } catch (error) {
    if (error instanceof GroqError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new GroqError("Groq request timed out.");
    }

    throw new GroqError("Unable to generate a medical response right now.");
  } finally {
    clearTimeout(timeout);
  }
}
