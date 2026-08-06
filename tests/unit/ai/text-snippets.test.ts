import { describe, expect, it } from "vitest";
import { compactPhrase } from "@/ai/text-snippets";

describe("compactPhrase", () => {
  it("keeps complete sentences when truncating long quiz options", () => {
    const phrase = compactPhrase(
      "La ripresa dei pellegrinaggi nel Medioevo si intrecciò con la nascita delle Crociate, influenzando mercati e commerci.",
      120
    );

    expect(phrase).not.toMatch(/delle\.$/);
    expect(phrase.endsWith(".")).toBe(true);
    expect(phrase.length).toBeLessThanOrEqual(121);
  });

  it("does not end quiz options on dangling prepositions like in modo.", () => {
    const phrase = compactPhrase(
      "Il metodo scientifico è un procedimento strutturato per studiare la realtà in modo oggettivo e verificabile.",
      120
    );

    expect(phrase).not.toMatch(/in modo\.$/);
    expect(phrase).toMatch(/oggettivo|verificabile|…/);
  });
});
