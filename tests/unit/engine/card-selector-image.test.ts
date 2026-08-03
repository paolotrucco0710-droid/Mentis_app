import { describe, expect, it } from "vitest";
import { selectCardForAtom } from "@/engine/card-selector";
import { CardType } from "@/domain/enums";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import { makeCard, makeUserAtomState } from "../../helpers/fixtures";
import type { CardId } from "@/domain/ids";

function makeCardState(cardId: CardId, viewCount: number) {
  return {
    userId: cardId,
    cardId,
    viewCount,
    correctAnswerCount: 0,
    wrongAnswerCount: 0,
    averageResponseTimeMs: null,
    lastAnsweredAt: null,
    confidence: 0.5,
    perceivedDifficulty: 0.5,
    skipped: false,
    liked: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("image explain selection", () => {
  it("prefers retrieval cards over image cards right after explain", () => {
    const explain = makeCard({
      id: "00000000-0000-4000-8000-000000000201" as CardId,
      type: CardType.Explain,
      order: 0,
    });
    const image = makeCard({
      id: "00000000-0000-4000-8000-000000000204" as CardId,
      type: CardType.ImageExplain,
      order: 6,
      payload: {
        imageId: "00000000-0000-4000-8000-000000000301",
        question: "Quale affermazione descrive meglio ciò che vedi?",
        options: ["A", "B", "C", "D"],
        correctOptionIndex: 0,
      },
    });
    const quiz = makeCard({
      id: "00000000-0000-4000-8000-000000000202" as CardId,
      type: CardType.Quiz,
      order: 1,
      payload: {
        question: "Domanda",
        options: ["A", "B", "C", "D"],
        correctOptionIndex: 0,
      },
    });

    const selected = selectCardForAtom({
      cards: [quiz, image, explain],
      atomState: makeUserAtomState({ exposureCount: 1 }),
      stage: CognitiveAtomStage.Learning,
      userCardStates: new Map([
        [explain.id, makeCardState(explain.id, 1)],
      ]),
      lastCardType: CardType.Explain,
      recentCardTypes: [CardType.Explain],
    });

    expect(selected?.type).toBe(CardType.Quiz);
  });

  it("allows image explain cards to reappear before the repeat cap", () => {
    const explain = makeCard({
      id: "00000000-0000-4000-8000-000000000201" as CardId,
      type: CardType.Explain,
      order: 0,
    });
    const image = makeCard({
      id: "00000000-0000-4000-8000-000000000204" as CardId,
      type: CardType.ImageExplain,
      order: 6,
      payload: {
        imageId: "00000000-0000-4000-8000-000000000301",
        question: "Quale affermazione descrive meglio ciò che vedi?",
        options: ["A", "B", "C", "D"],
        correctOptionIndex: 0,
      },
    });
    const quiz = makeCard({
      id: "00000000-0000-4000-8000-000000000202" as CardId,
      type: CardType.Quiz,
      order: 1,
      payload: {
        question: "Domanda",
        options: ["A", "B", "C", "D"],
        correctOptionIndex: 0,
      },
    });

    const selected = selectCardForAtom({
      cards: [quiz, image, explain],
      atomState: makeUserAtomState({ exposureCount: 2 }),
      stage: CognitiveAtomStage.Consolidating,
      userCardStates: new Map([
        [explain.id, makeCardState(explain.id, 1)],
        [quiz.id, makeCardState(quiz.id, 1)],
        [image.id, makeCardState(image.id, 1)],
      ]),
      lastCardType: CardType.TrueFalse,
      recentCardTypes: [CardType.Explain, CardType.Quiz, CardType.TrueFalse],
    });

    expect(selected?.type).toBe(CardType.ImageExplain);
  });
});
