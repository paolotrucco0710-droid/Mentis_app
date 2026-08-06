const MAX_STEPS = 3;
const MIN_STEP_ANSWER_CHARS = 3;
const MIN_FINAL_ANSWER_CHARS = 5;

export type BlurtingFlowPhase = "ready" | "recall" | "feedback";

export function buildBlurtingSteps(keyPoints: string[]): string[] {
  const points = keyPoints.map((point) => point.trim()).filter(Boolean);

  if (points.length === 0) {
    return [""];
  }

  return points.slice(0, MAX_STEPS);
}

export function combineBlurtingAnswers(
  steps: string[],
  answers: string[]
): string {
  return steps
    .map((point, index) => {
      const answer = answers[index]?.trim();
      if (!answer) {
        return null;
      }

      if (point) {
        return `${point}\n${answer}`;
      }

      return answer;
    })
    .filter((entry): entry is string => Boolean(entry))
    .join("\n\n");
}

export function getBlurtingStepPrompt(
  stepIndex: number,
  totalSteps: number
): string {
  if (totalSteps === 1) {
    return "Scrivi tutto ciò che ricordi senza guardare gli appunti.";
  }

  return `Punto ${stepIndex + 1} di ${totalSteps}: scrivi con parole tue.`;
}

export function canAdvanceBlurtingStep(
  answer: string,
  stepIndex: number,
  totalSteps: number
): boolean {
  const trimmed = answer.trim();

  if (totalSteps === 1) {
    return trimmed.length >= MIN_FINAL_ANSWER_CHARS;
  }

  if (stepIndex < totalSteps - 1) {
    return trimmed.length >= MIN_STEP_ANSWER_CHARS;
  }

  return trimmed.length >= MIN_STEP_ANSWER_CHARS;
}

export function getBlurtingContinueLabel(
  stepIndex: number,
  totalSteps: number
): string {
  if (stepIndex >= totalSteps - 1) {
    return "Fine";
  }

  return "Avanti";
}
