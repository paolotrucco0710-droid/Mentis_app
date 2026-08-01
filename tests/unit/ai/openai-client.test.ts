import { afterEach, describe, expect, it, vi } from "vitest";

describe("ai/client OpenAI-compatible providers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("configures a custom base URL for OpenRouter-compatible gateways", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-or-test-key");
    vi.stubEnv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1");
    vi.stubEnv("OPENAI_APP_NAME", "Mentis");
    vi.stubEnv("OPENAI_HTTP_REFERER", "http://localhost:3000");

    const OpenAI = vi.fn(function MockOpenAI(this: {
      apiKey: string;
      baseURL?: string;
      defaultHeaders?: Record<string, string>;
    }) {
      this.apiKey = "";
    });

    vi.doMock("openai", () => ({
      default: OpenAI,
    }));

    const { getOpenAIClient, resetOpenAIClientForTests } = await import(
      "@/ai/client"
    );
    resetOpenAIClientForTests();
    getOpenAIClient();

    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: "sk-or-test-key",
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Mentis",
      },
    });
  });
});
