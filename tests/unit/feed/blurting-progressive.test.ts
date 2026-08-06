import { describe, expect, it } from "vitest";
import {
  buildBlurtingSteps,
  canAdvanceBlurtingStep,
  combineBlurtingAnswers,
  getBlurtingContinueLabel,
  getBlurtingStepPrompt,
} from "@/components/feed/blurting-progressive";

describe("blurting-progressive", () => {
  it("always uses a single free-recall step", () => {
    expect(buildBlurtingSteps()).toEqual([""]);
  });

  it("combines only user answers for evaluation", () => {
    expect(
      combineBlurtingAnswers([
        "È un processo storico.",
        "Avvenne in Spagna.",
      ])
    ).toBe("È un processo storico.\n\nAvvenne in Spagna.");
  });

  it("shows the recall prompt during the step", () => {
    expect(getBlurtingStepPrompt("Cosa ricordi su Roma?")).toBe(
      "Cosa ricordi su Roma?"
    );
    expect(getBlurtingStepPrompt()).toContain("tutto ciò che ricordi");
  });

  it("requires a longer answer before Fine", () => {
    expect(canAdvanceBlurtingStep("abc")).toBe(false);
    expect(canAdvanceBlurtingStep("abbastanza lunga")).toBe(true);
  });

  it("labels the submit button as Fine", () => {
    expect(getBlurtingContinueLabel()).toBe("Fine");
  });
});
