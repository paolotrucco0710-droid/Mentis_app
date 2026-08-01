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
import { coerceKnowledgeJson, extractJsonPayload } from "./coerce-knowledge-json";
import { estimateModelCost } from "./optimization/cost";

const MAX_EXTRACTION_ATTEMPTS = 3;

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

  let lastInvalidContent: string | null = null;
  let lastValidationError: string | null = null;

  for (let attempt = 1; attempt <= MAX_EXTRACTION_ATTEMPTS; attempt++) {
    const response = await runChatCompletion(
      {
        model: env.aiReasoningModel,
        response_format: { type: "json_object" },
        messages:
          attempt === 1
            ? [
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
              ]
            : [
                { role: "system", content: buildExtractionSystemPrompt() },
                {
                  role: "user",
                  content: buildExtractionRepairPrompt(
                    lastInvalidContent ?? "",
                    lastValidationError ?? "JSON non valido."
                  ),
                },
              ],
        temperature: 0,
        max_tokens: 16384,
      },
      tracker
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Il modello non ha restituito alcun contenuto.");
    }

    const parsed = tryParseKnowledgeJson(content);
    if (parsed.ok) {
      await cacheExtractionResult({
        cacheKey,
        textHash,
        fileHash: input.fileHash,
        content,
        usage: response.usage,
        tracker,
      });
      return parsed.data;
    }

    lastInvalidContent = content;
    lastValidationError = parsed.error;
  }

  throw new Error(
    `JSON non valido dopo ${MAX_EXTRACTION_ATTEMPTS} tentativi: ${lastValidationError}`
  );
}

function buildExtractionRepairPrompt(
  invalidJson: string,
  validationError: string
): string {
  return `Il JSON precedente non rispetta lo schema richiesto.

Errori di validazione:
${validationError}

JSON da correggere:
---
${invalidJson}
---

Correggi il JSON mantenendo tutti i campi obbligatori per metadata e ogni atom.
Usa array vuoti [] per campi senza contenuto e null per historicalContext/notes quando assenti.
Rispondi SOLO con il JSON corretto.`;
}

async function cacheExtractionResult(input: {
  cacheKey: string;
  textHash: string;
  fileHash?: string;
  content: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  tracker: UsageTracker;
}): Promise<void> {
  const inputTokens = input.usage?.prompt_tokens ?? 0;
  const outputTokens = input.usage?.completion_tokens ?? 0;
  const estimatedCostUsd = estimateModelCost(
    env.aiReasoningModel,
    inputTokens,
    outputTokens
  );

  await writeCacheResult({
    cacheKey: input.cacheKey,
    kind: "extraction",
    contentHash: input.textHash,
    model: env.aiReasoningModel,
    promptVersion: env.aiPromptVersion,
    parserVersion: env.knowledgeJsonVersion,
    result: input.content,
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
      result: input.content,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
    });
  }
}

function tryParseKnowledgeJson(
  content: string
): { ok: true; data: ParsedKnowledgeJson } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonPayload(content));
  } catch {
    return { ok: false, error: "Output LLM non è JSON valido." };
  }

  const coerced = coerceKnowledgeJson(parsed);
  const result = knowledgeJsonSchema.safeParse(coerced);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 8)
      .map((issue) => issue.message)
      .join("; ");
    return {
      ok: false,
      error: `JSON non valido: ${issues}`,
    };
  }

  return { ok: true, data: result.data };
}

function parseKnowledgeJson(content: string): ParsedKnowledgeJson {
  const result = tryParseKnowledgeJson(content);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.data;
}
