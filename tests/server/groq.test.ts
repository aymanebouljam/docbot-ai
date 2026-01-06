import {
  buildMedicalSystemPrompt,
  generateMedicalAnswer,
  GroqError,
} from "@/server/groq";

describe("groq integration", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.GROQ_MODEL;

  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.GROQ_MODEL = "test-model";
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GROQ_API_KEY = originalApiKey;
    process.env.GROQ_MODEL = originalModel;
  });

  it("builds a medical safety-oriented system prompt", () => {
    const prompt = buildMedicalSystemPrompt();

    expect(prompt).toMatch(/medical educational assistant/i);
    expect(prompt).toMatch(/do not claim to diagnose with certainty/i);
    expect(prompt).toMatch(/encourage urgent in-person care/i);
  });

  it("handles a successful Groq response", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "High blood pressure can increase cardiovascular risk.",
              },
            },
          ],
        }),
        { status: 200 }
      )
    );

    const result = await generateMedicalAnswer({
      prompt: "What does high blood pressure mean?",
    });

    expect(result).toMatch(/cardiovascular risk/i);
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("handles a Groq API failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: "Rate limit reached",
          },
        }),
        { status: 429 }
      )
    );

    await expect(
      generateMedicalAnswer({
        prompt: "What causes a fever?",
      })
    ).rejects.toThrow(GroqError);
  });
});
