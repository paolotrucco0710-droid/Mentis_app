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
  isCorrect: z.boolean(),
  score: z.number().min(0).max(100),
  strengths: z.array(z.string().min(1).max(80)).max(1),
  gaps: z.array(z.string().min(1).max(80)).max(1),
  suggestion: z.string().min(1).max(100),
  summary: z.string().min(1).max(120),
});

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
- Se isCorrect=true: strengths, gaps e suggestion devono essere array/stringa vuoti.
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

function parseEvaluationContent(content: string): RetrievalFeedback {
  const parsed = retrievalFeedbackSchema.parse(
    JSON.parse(extractJsonPayload(content))
  );

  return {
    ...parsed,
    source: "ai",
  };
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
    const response = await runChatCompletion(
      {
        model: env.aiReasoningModel,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Sei un tutor di Mentis. Feedback ultra-breve in italiano: una frase netta, niente liste lunghe.",
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return buildHeuristicRetrievalFeedback(input);
    }

    throw toUserFacingAIError(error);
  }
}
