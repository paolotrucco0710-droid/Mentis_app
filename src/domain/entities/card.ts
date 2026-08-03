import type { AtomId, CardId } from "../ids";
import type { CardType, CognitiveObjective } from "../enums";

/** Type-specific card data — no autonomous knowledge (Invariant 15). */
export interface QuizCardPayload {
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface TrueFalseCardPayload {
  statement: string;
  correctAnswer: boolean;
}

export interface FillBlankCardPayload {
  textWithBlanks: string;
  answers: string[];
}

export interface BlurtingCardPayload {
  prompt: string;
  keyPoints: string[];
}

export interface FeynmanCardPayload {
  prompt: string;
  evaluationCriteria: string[];
}

export interface ErrorDetectionCardPayload {
  text: string;
  errorIndices: number[];
  correction: string;
}

export interface ImageExplainCardPayload {
  imageId: string;
  question?: string;
  options?: string[];
  correctOptionIndex?: number;
  revealText?: string;
}

export interface MatchCardPayload {
  pairs: Array<{ left: string; right: string }>;
}

export interface OrderCardPayload {
  items: string[];
  correctOrder: number[];
}

export type CardPayload =
  | QuizCardPayload
  | TrueFalseCardPayload
  | FillBlankCardPayload
  | BlurtingCardPayload
  | FeynmanCardPayload
  | ErrorDetectionCardPayload
  | ImageExplainCardPayload
  | MatchCardPayload
  | OrderCardPayload
  | Record<string, unknown>;

/**
 * Card — a cognitive interaction derived from an Atom.
 * Many cards per atom; cards do not represent progress.
 */
export interface Card {
  id: CardId;
  atomId: AtomId;
  type: CardType;
  order: number;
  cognitiveObjective: CognitiveObjective;
  prompt: string | null;
  text: string;
  explanation: string | null;
  correctFeedback: string | null;
  incorrectFeedback: string | null;
  estimatedDurationSeconds: number;
  payload: CardPayload | null;
  aiVersion: string | null;
  createdAt: Date;
}
