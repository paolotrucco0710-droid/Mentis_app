import { describe, expect, it } from "vitest";
import { buildBlurtingKeyPoints, buildBlurtingMainPrompt, buildTrueFalseCards } from "@/ai/micro-cards";

describe("micro-cards", () => {
  it("builds a user-facing blurting prompt", () => {
    expect(
      buildBlurtingMainPrompt({
        title: "Civiltà romana",
        summary: "La civiltà romana si sviluppò nel Mediterraneo.",
        keywords: ["legione"],
      })
    ).toContain("Civiltà romana");
  });

  it("builds evaluation key points without arbitrary keyword suffixes", () => {
    const points = buildBlurtingKeyPoints({
      title: "Pellegrinaggi",
      summary:
        "I pellegrinaggi erano viaggi a luoghi sacri che nel Medioevo si legarono allo sviluppo economico e alle Crociate.",
      definitions: [
        "I pellegrinaggi erano viaggi a luoghi sacri con motivazioni spirituali.",
      ],
      examples: [
        "Il cammino verso Gerusalemme aumentò il commercio lungo le rotte.",
      ],
      keywords: ["Crociate"],
    });

    expect(points.length).toBeLessThanOrEqual(4);
    expect(points.every((point) => point.length <= 160)).toBe(true);
    expect(points.some((point) => point.includes("Pellegrinaggi: Crociate"))).toBe(
      false
    );
  });

  it("builds blurting key points when examples are omitted", () => {
    const points = buildBlurtingKeyPoints({
      title: "Fotosintesi",
      summary: "Le piante convertono luce e CO₂ in energia chimica.",
      definitions: ["La fotosintesi produce glucosio e ossigeno."],
    });

    expect(points.length).toBeGreaterThan(0);
    expect(points.every((point) => point.length <= 160)).toBe(true);
  });

  it("creates up to two distinct true/false cards", () => {
    const cards = buildTrueFalseCards({
      title: "Signorie cittadine",
      summary: "Le Signorie cittadine emersero intorno al 1300.",
      explanation: "Il potere era concentrato in un signore.",
      misconceptions: [
        "Pensare che tutte le Signorie siano nate da un'unica modalità di acquisizione del potere.",
      ],
      commonMistakes: [],
      definitions: [
        "Le Signorie cittadine erano governi personali guidati da un signore.",
      ],
      counterExamples: [],
    });

    expect(cards.length).toBe(2);
    expect(cards[0]?.correctAnswer).toBe(false);
    expect(cards[1]?.correctAnswer).toBe(true);
    expect(cards[0]?.statement).not.toBe(cards[1]?.statement);
  });
});
