const MIN_FINAL_ANSWER_CHARS = 5;

export type BlurtingFlowPhase = "ready" | "recall" | "feedback";

/** Blurting is always single-step free recall (MENTIS_MASTER_CONTEXT). */
export function buildBlurtingSteps(): string[] {
  return [""];
}

export function combineBlurtingAnswers(
  answers: string[]
): string {
  return answers
    .map((answer) => answer.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function getBlurtingStepPrompt(recallPrompt?: string): string {
  return (
    recallPrompt?.trim() ||
    "Scrivi tutto ciò che ricordi senza guardare gli appunti."
  );
}

export function canAdvanceBlurtingStep(answer: string): boolean {
  return answer.trim().length >= MIN_FINAL_ANSWER_CHARS;
}

export function getBlurtingContinueLabel(): string {
  return "Fine";
}
