import { describe, expect, it } from "vitest";
import {
  buildBlurtingSteps,
  canAdvanceBlurtingStep,
  combineBlurtingAnswers,
  getBlurtingContinueLabel,
  getBlurtingStepPrompt,
} from "@/components/feed/blurting-progressive";

describe("blurting-progressive", () => {
  it("caps guided steps at three key points", () => {
    expect(
      buildBlurtingSteps([
        "Primo",
        "Secondo",
        "Terzo",
        "Quarto",
      ])
    ).toEqual(["Primo", "Secondo", "Terzo"]);
  });

  it("falls back to a single free-recall step when key points are missing", () => {
    expect(buildBlurtingSteps([])).toEqual([""]);
  });

  it("combines step answers for final evaluation", () => {
    expect(
      combineBlurtingAnswers(
        ["Definizione", "Esempio"],
        ["È un processo storico.", "Avvenne in Spagna."]
      )
    ).toBe("Definizione\nÈ un processo storico.\n\nEsempio\nAvvenne in Spagna.");
  });

  it("uses progressive prompts for multi-step blurting", () => {
    expect(getBlurtingStepPrompt(0, 3)).toBe(
      "Punto 1 di 3: scrivi con parole tue."
    );
    expect(getBlurtingStepPrompt(0, 1)).toContain("tutto ciò che ricordi");
  });

  it("requires a longer answer on the final single-step recall", () => {
    expect(canAdvanceBlurtingStep("abc", 0, 1)).toBe(false);
    expect(canAdvanceBlurtingStep("abbastanza lunga", 0, 1)).toBe(true);
  });

  it("labels the last step as Fine", () => {
    expect(getBlurtingContinueLabel(0, 3)).toBe("Avanti");
    expect(getBlurtingContinueLabel(2, 3)).toBe("Fine");
  });
});
