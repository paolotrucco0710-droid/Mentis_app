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
  strengths: z.array(z.string().min(1)).max(3),
  gaps: z.array(z.string().min(1)).max(3),
  suggestion: z.string().min(1).max(400),
  summary: z.string().min(1).max(400),
});

const MAX_USER_ANSWER_CHARS = 2_500;

export function normalizeUserAnswer(answer: string): string {
  return answer.trim().slice(0, MAX_USER_ANSWER_CHARS);
}

export function buildHeuristicRetrievalFeedback(
  input: EvaluateRetrievalAnswerInput
): RetrievalFeedback {
  const answer = normalizeUserAnswer(input.userAnswer);
  const minLength = input.mode === "feynman" ? 30 : 20;
  const longEnough = answer.length >= minLength;
  const matchedPoints = input.referencePoints.filter((point) => {
    const tokens = point
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 4)
      .slice(0, 4);

    return tokens.some((token) => answer.toLowerCase().includes(token));
  });

  const score = Math.min(
    100,
    Math.round(
      (longEnough ? 45 : 20) +
        matchedPoints.length * 15 +
        Math.min(answer.length / 8, 20)
    )
  );

  return {
    isCorrect: score >= 60,
    score,
    strengths:
      matchedPoints.length > 0
        ? matchedPoints.slice(0, 2).map((point) => `Hai menzionato: ${point}`)
        : longEnough
          ? ["Hai provato a richiamare il concetto con parole tue."]
          : [],
    gaps: input.referencePoints
      .filter((point) => !matchedPoints.includes(point))
      .slice(0, 2),
    suggestion:
      input.mode === "feynman"
        ? "Prova a spiegare il concetto con un esempio concreto e parole semplici."
        : "Integra i punti mancanti e collega cause ed effetti in una frase.",
    summary: longEnough
      ? "Risposta utile. Confronta con il feedback e i punti chiave."
      : "Risposta troppo breve. Aggiungi i dettagli essenziali del concetto.",
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
- Valuta comprensione reale, non lunghezza o stile perfetto.
- Tono incoraggiante. Mai punizioni o giudizi duri.
- isCorrect=true se la risposta coglie l'idea centrale anche con parole diverse.
- strengths: 1-3 punti forti concreti (array vuoto se davvero nulla).
- gaps: 1-3 elementi mancanti o imprecisi (array vuoto se tutto ok).
- suggestion: un solo consiglio pratico e breve.
- summary: feedback generale in 1-2 frasi, in italiano.

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
              "Sei un tutor di Mentis. Valuti risposte di studio in italiano con feedback breve, chiaro e incoraggiante.",
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
