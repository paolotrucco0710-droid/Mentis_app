import { env } from "@/lib/env";
import {
  buildExtractionCacheKey,
  hashText,
  readCacheResult,
  runChatCompletion,
  UsageTracker,
  writeCacheResult,
} from "./optimization";
import {
  buildExtractionSystemPrompt,
  buildExtractionUserPrompt,
} from "./prompts";
import { knowledgeJsonSchema, type ParsedKnowledgeJson } from "./schema";
import { estimateModelCost } from "./optimization/cost";

export async function extractKnowledgeJson(
  input: {
    title: string;
    subject: string;
    language: string;
    cleanedText: string;
    fileHash?: string;
  },
  tracker: UsageTracker
): Promise<ParsedKnowledgeJson> {
  const textHash = hashText(input.cleanedText);
  const cacheKey = buildExtractionCacheKey({
    textHash,
    promptVersion: env.aiPromptVersion,
    parserVersion: env.knowledgeJsonVersion,
    model: env.aiReasoningModel,
  });

  const cached = await readCacheResult<string>(cacheKey);
  if (cached) {
    tracker.recordCacheHit();
    return parseKnowledgeJson(cached.value);
  }

  if (input.fileHash) {
    const fileCached = await readCacheResult<string>(
      buildExtractionCacheKey({
        textHash: input.fileHash,
        promptVersion: env.aiPromptVersion,
        parserVersion: env.knowledgeJsonVersion,
        model: env.aiReasoningModel,
      })
    );
    if (fileCached) {
      tracker.recordCacheHit();
      return parseKnowledgeJson(fileCached.value);
    }
  }

  tracker.recordCacheMiss();

  const response = await runChatCompletion(
    {
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
    },
    tracker
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Il modello non ha restituito alcun contenuto.");
  }

  const parsed = parseKnowledgeJson(content);
  const usage = response.usage;
  const inputTokens = usage?.prompt_tokens ?? 0;
  const outputTokens = usage?.completion_tokens ?? 0;
  const estimatedCostUsd = estimateModelCost(
    env.aiReasoningModel,
    inputTokens,
    outputTokens
  );

  await writeCacheResult({
    cacheKey,
    kind: "extraction",
    contentHash: textHash,
    model: env.aiReasoningModel,
    promptVersion: env.aiPromptVersion,
    parserVersion: env.knowledgeJsonVersion,
    result: content,
    inputTokens,
    outputTokens,
    estimatedCostUsd,
  });

  if (input.fileHash) {
    await writeCacheResult({
      cacheKey: buildExtractionCacheKey({
        textHash: input.fileHash,
        promptVersion: env.aiPromptVersion,
        parserVersion: env.knowledgeJsonVersion,
        model: env.aiReasoningModel,
      }),
      kind: "extraction",
      contentHash: input.fileHash,
      model: env.aiReasoningModel,
      promptVersion: env.aiPromptVersion,
      parserVersion: env.knowledgeJsonVersion,
      result: content,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
    });
  }

  return parsed;
}

function parseKnowledgeJson(content: string): ParsedKnowledgeJson {
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
