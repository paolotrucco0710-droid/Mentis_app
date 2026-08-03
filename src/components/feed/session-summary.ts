import type { EndSessionResult } from "@/session/types";

export interface SessionSummaryView {
  cardsViewed: number;
  conceptsStudied: string[];
  atomsCompleted: number;
  correctAnswers: number;
  accuracy: number;
  activeDurationMs: number;
  masteryGain: number;
}

export function buildSessionSummaryView(
  result: EndSessionResult,
  input: {
    conceptsStudied: string[];
    masteryGain: number;
  }
): SessionSummaryView {
  return {
    cardsViewed: result.session.cardsViewed,
    conceptsStudied: input.conceptsStudied,
    atomsCompleted: result.session.atomsCompleted,
    correctAnswers: result.session.correctAnswerCount,
    accuracy: result.metrics.accuracy,
    activeDurationMs: result.metrics.activeDurationMs,
    masteryGain: input.masteryGain,
  };
}
