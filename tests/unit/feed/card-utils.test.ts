import { describe, expect, it } from "vitest";
import { canRenderFeedCard } from "@/components/feed/card-utils";
import { CardType } from "@/domain/enums";
import type { Card } from "@/domain/entities/card";

function makeCard(overrides: Partial<Card>): Card {
  return {
    id: "00000000-0000-4000-8000-000000000201",
    atomId: "00000000-0000-4000-8000-000000000202",
    type: CardType.Quiz,
    order: 1,
    cognitiveObjective: "retrieval",
    prompt: "Domanda",
    text: "Testo",
    explanation: null,
    correctFeedback: null,
    incorrectFeedback: null,
    estimatedDurationSeconds: 20,
    payload: null,
    aiVersion: "1.0.0",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Card;
}

describe("canRenderFeedCard", () => {
  it("accepts quiz cards with a valid payload", () => {
    expect(
      canRenderFeedCard(
        makeCard({
          payload: {
            question: "Domanda?",
            options: ["A", "B", "C", "D"],
            correctOptionIndex: 1,
          },
        })
      )
    ).toBe(true);
  });

  it("rejects quiz cards with missing or invalid payload", () => {
    expect(canRenderFeedCard(makeCard({ payload: null }))).toBe(false);
    expect(
      canRenderFeedCard(
        makeCard({
          payload: {
            question: "Domanda?",
            options: ["A"],
            correctOptionIndex: 0,
          },
        })
      )
    ).toBe(false);
  });

  it("rejects connection cards without prerequisite metadata", () => {
    expect(
      canRenderFeedCard(
        makeCard({
          type: CardType.Connection,
          payload: {
            question: "Legame?",
            options: ["A", "B"],
            correctOptionIndex: 0,
          },
        })
      )
    ).toBe(false);
  });

  it("accepts connection cards with a valid payload", () => {
    expect(
      canRenderFeedCard(
        makeCard({
          type: CardType.Connection,
          payload: {
            relatedAtomId: "00000000-0000-4000-8000-000000000301",
            relatedAtomTitle: "Prerequisito",
            relationType: "prerequisite",
            question: "Legame?",
            options: ["A", "B", "C", "D"],
            correctOptionIndex: 2,
          },
        })
      )
    ).toBe(true);
  });
});
