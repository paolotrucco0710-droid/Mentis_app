import { getOpenAIClient } from "./client";
import {
  buildExtractionSystemPrompt,
  buildExtractionUserPrompt,
} from "./prompts";
import { knowledgeJsonSchema, type ParsedKnowledgeJson } from "./schema";
import { env } from "@/lib/env";

export async function extractKnowledgeJson(input: {
  title: string;
  subject: string;
  language: string;
  cleanedText: string;
}): Promise<ParsedKnowledgeJson> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: env.aiReasoningModel,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildExtractionSystemPrompt() },
      {
        role: "user",
        content: buildExtractionUserPrompt(
          input.title,
          input.subject,
          input.language,
          input.cleanedText
        ),
      },
    ],
    temperature: 0,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Il modello non ha restituito alcun contenuto.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Output LLM non è JSON valido.");
  }

  const result = knowledgeJsonSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `JSON non valido: ${result.error.issues.map((issue) => issue.message).join("; ")}`
    );
  }

  return result.data;
}
