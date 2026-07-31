import type OpenAI from "openai";
import { env } from "@/lib/env";
import { getOpenAIClient } from "../client";
import { aiRateLimiter } from "./rate-limiter";
import { withRetry } from "./retry";
import type { UsageTracker } from "./usage-tracker";

export async function runChatCompletion(
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  tracker: UsageTracker
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  return aiRateLimiter.run(() =>
    withRetry(
      async () => {
        const client = getOpenAIClient();
        const response = await client.chat.completions.create(params);
        tracker.recordUsage(params.model, response.usage);
        return response;
      },
      {
        maxAttempts: env.aiRetryMaxAttempts,
        baseDelayMs: env.aiRetryBaseDelayMs,
      }
    )
  );
}
