import OpenAI from "openai";
import { assertOpenAIConfigured, env } from "@/lib/env";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  assertOpenAIConfigured();
  if (!client) {
    const defaultHeaders: Record<string, string> = {};

    if (env.openaiHttpReferer) {
      defaultHeaders["HTTP-Referer"] = env.openaiHttpReferer;
    }

    if (env.openaiAppName) {
      defaultHeaders["X-Title"] = env.openaiAppName;
    }

    client = new OpenAI({
      apiKey: env.openaiApiKey,
      ...(env.openaiBaseUrl ? { baseURL: env.openaiBaseUrl } : {}),
      ...(Object.keys(defaultHeaders).length > 0 ? { defaultHeaders } : {}),
    });
  }
  return client;
}

export function resetOpenAIClientForTests(): void {
  client = null;
}
