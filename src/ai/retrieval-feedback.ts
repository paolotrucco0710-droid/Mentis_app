import { z } from "zod";
import { env } from "@/lib/env";
import { extractJsonPayload } from "./coerce-knowledge-json";
import { toUserFacingAIError } from "./errors";
import { AIProcessingError } from "./pipeline";
import { runChatCompletion } from "./optimization";
import { UsageTracker } from "./optimization/usage-tracker";

export type RetrievalEvaluationMode = "blurting" | "feynman";

export interface EvaluateRetrievalAnswerInput {
  mode: RetrievalEvaluationMode;
  atomTitle: string;
  atomSummary: string;
  atomExplanation: string;
  prompt: string;
  referencePoints: string[];
  userAnswer: string;
}

export interface RetrievalFeedback {
  isCorrect: boolean;
  score: number;
  strengths: string[];
  gaps: string[];
  suggestion: string;
  summary: string;
  source: "ai" | "heuristic";
}

const retrievalFeedbackSchema = z.object({
  isCorrect: z.coerce.boolean(),
  score: z.coerce.number().min(0).max(100),
  strengths: z
    .union([z.array(z.string()), z.string(), z.null()])
    .optional(),
  gaps: z.union([z.array(z.string()), z.string(), z.null()]).optional(),
  suggestion: z.union([z.string(), z.null()]).optional(),
  summary: z.string().min(1).max(240),
});

function toStringList(value: string | string[] | null | undefined): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  const trimmed = value.trim();
  return trimmed ? [trimmed] : [];
}

function normalizeAiFeedback(
  parsed: z.infer<typeof retrievalFeedbackSchema>
): RetrievalFeedback {
  const strengths = toStringList(parsed.strengths).slice(0, 1);
  const gaps = toStringList(parsed.gaps).slice(0, 1);
  const suggestion = parsed.suggestion?.trim() ?? "";

  return {
    isCorrect: parsed.isCorrect,
    score: Math.round(parsed.score),
    strengths: parsed.isCorrect ? [] : strengths,
    gaps: parsed.isCorrect ? [] : gaps,
    suggestion: parsed.isCorrect ? "" : suggestion,
    summary: parsed.summary.trim(),
    source: "ai",
  };
}

function parseEvaluationContent(content: string): RetrievalFeedback {
  const parsed = retrievalFeedbackSchema.parse(
    JSON.parse(extractJsonPayload(content))
  );

  return normalizeAiFeedback(parsed);
}

/** @internal Exported for unit tests. */
export function parseRetrievalFeedbackContent(content: string): RetrievalFeedback {
  return parseEvaluationContent(content);
}

const MAX_USER_ANSWER_CHARS = 2_500;

export function normalizeUserAnswer(answer: string): string {
  return answer.trim().slice(0, MAX_USER_ANSWER_CHARS);
}

function pointMatchRatio(point: string, answer: string): number {
  const answerLower = answer.toLowerCase();
  const tokens = point
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 4);

  if (tokens.length === 0) {
    return 0;
  }

  const matched = tokens.filter((token) => answerLower.includes(token));
  return matched.length / tokens.length;
}

export function buildHeuristicRetrievalFeedback(
  input: EvaluateRetrievalAnswerInput
): RetrievalFeedback {
  const answer = normalizeUserAnswer(input.userAnswer);
  const minLength = input.mode === "feynman" ? 40 : 30;
  const longEnough = answer.length >= minLength;
  const matchedPoints = input.referencePoints.filter(
    (point) => pointMatchRatio(point, answer) >= 0.4
  );
  const bestMatchRatio = input.referencePoints.reduce(
    (best, point) => Math.max(best, pointMatchRatio(point, answer)),
    0
  );

  const score = Math.min(
    100,
    Math.round(
      (longEnough ? 25 : 10) +
        matchedPoints.length * 20 +
        bestMatchRatio * 25 +
        Math.min(answer.length / 12, 10)
    )
  );

  return {
    isCorrect: score >= 72 && matchedPoints.length > 0,
    score,
    strengths: [],
    gaps:
      matchedPoints.length > 0
        ? []
        : input.referencePoints.slice(0, 1),
    suggestion:
      matchedPoints.length > 0
        ? ""
        : input.mode === "feynman"
          ? "Aggiungi un esempio concreto."
          : "Aggiungi il punto centrale con parole tue.",
    summary:
      matchedPoints.length > 0
        ? "Ottimo, hai colto il concetto."
        : longEnough
          ? "Ci sei vicino: manca il punto centrale."
          : "Troppo breve: aggiungi un dettaglio in più.",
    source: "heuristic",
  };
}

function buildEvaluationPrompt(input: EvaluateRetrievalAnswerInput): string {
  const modeLabel =
    input.mode === "blurting"
      ? "Blurting (richiamo attivo)"
      : "Tecnica Feynman (spiegazione semplice)";

  return `Valuta la risposta di uno studente italiano.

Modalità: ${modeLabel}
Concetto: ${input.atomTitle}
Riassunto corretto: ${input.atomSummary}
Spiegazione di riferimento: ${input.atomExplanation}
Prompt della card: ${input.prompt}
Punti/criteri di riferimento:
${input.referencePoints.map((point) => `- ${point}`).join("\n")}

Risposta dello studente:
"""
${normalizeUserAnswer(input.userAnswer)}
"""

Regole:
- Valuta comprensione reale, non perfezione formale.
- Tono incoraggiante e diretto. Niente "è corretta ma...".
- Ignora errori marginali (date esatte, traslitterazioni, refusi) se l'idea centrale è giusta.
- isCorrect=true se la risposta coglie l'idea centrale, anche senza tutti i dettagli.
- Se isCorrect=true: strengths=[], gaps=[], suggestion="" (stringa vuota).
- summary: UNA frase breve e positiva se corretto; altrimenti cosa manca in concreto.
- strengths: al massimo 1 elemento breve (vuoto se corretto o nulla di utile).
- gaps: al massimo 1 lacuna (vuoto se corretto).
- suggestion: solo se isCorrect=false, una frase pratica max 12 parole.

Rispondi SOLO con JSON valido:
{
  "isCorrect": true,
  "score": 75,
  "strengths": ["..."],
  "gaps": ["..."],
  "suggestion": "...",
  "summary": "..."
}`; 
}

async function requestAiEvaluation(
  input: EvaluateRetrievalAnswerInput,
  tracker: UsageTracker
): Promise<RetrievalFeedback> {
  const response = await runChatCompletion(
    {
      model: env.aiReasoningModel,
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "Sei un tutor di Mentis. Valuta la comprensione reale dello studente e rispondi solo con JSON valido.",
        },
        {
          role: "user",
          content: buildEvaluationPrompt(input),
        },
      ],
    },
    tracker
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new AIProcessingError(
      "Il modello AI non ha restituito una valutazione.",
      "EMPTY_RESPONSE",
      502
    );
  }

  return parseEvaluationContent(content);
}

export async function evaluateRetrievalAnswer(
  input: EvaluateRetrievalAnswerInput
): Promise<RetrievalFeedback> {
  const answer = normalizeUserAnswer(input.userAnswer);

  if (answer.length < 5) {
    return buildHeuristicRetrievalFeedback(input);
  }

  if (!env.openaiApiKey) {
    return buildHeuristicRetrievalFeedback(input);
  }

  const tracker = new UsageTracker();

  try {
    return await requestAiEvaluation(input, tracker);
  } catch (error) {
    if (error instanceof z.ZodError) {
      try {
        return await requestAiEvaluation(input, tracker);
      } catch (retryError) {
        if (retryError instanceof z.ZodError || retryError instanceof SyntaxError) {
          return buildHeuristicRetrievalFeedback(input);
        }

        throw toUserFacingAIError(retryError);
      }
    }

    if (error instanceof SyntaxError) {
      return buildHeuristicRetrievalFeedback(input);
    }

    throw toUserFacingAIError(error);
  }
}
