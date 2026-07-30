import OpenAI from "openai";
import { assertOpenAIConfigured, env } from "@/lib/env";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  assertOpenAIConfigured();
  if (!client) {
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return client;
}
