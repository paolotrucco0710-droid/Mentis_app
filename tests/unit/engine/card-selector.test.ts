import { describe, expect, it } from "vitest";
import { CardType } from "@/domain/enums";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import {
  needsPrimaryIntroduction,
  selectCardForAtom,
} from "@/engine/card-selector";
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

describe("engine/card-selector", () => {
  it("returns null when no cards are available", () => {
    expect(
      selectCardForAtom({
        cards: [],
        atomState: makeUserAtomState(),
        stage: CognitiveAtomStage.Learning,
        userCardStates: new Map(),
        lastCardType: null,
      })
    ).toBeNull();
  });

  it("prefers explanation cards during early learning", () => {
    const explain = makeCard({
      id: "00000000-0000-4000-8000-000000000201" as never,
      type: CardType.Explain,
      order: 2,
    });
    const quiz = makeCard({
      id: "00000000-0000-4000-8000-000000000202" as never,
      type: CardType.Quiz,
      order: 1,
    });

    const selected = selectCardForAtom({
      cards: [quiz, explain],
      atomState: makeUserAtomState({ exposureCount: 0 }),
      stage: CognitiveAtomStage.Learning,
      userCardStates: new Map(),
      lastCardType: null,
    });

    expect(selected?.type).toBe(CardType.Explain);
  });

  it("requires explain before retrieval even when atom progress already exists", () => {
    const explain = makeCard({
      id: "00000000-0000-4000-8000-000000000201" as CardId,
      type: CardType.Explain,
      order: 0,
    });
    const quiz = makeCard({
      id: "00000000-0000-4000-8000-000000000202" as CardId,
      type: CardType.Quiz,
      order: 1,
    });
    const blurting = makeCard({
      id: "00000000-0000-4000-8000-000000000203" as CardId,
      type: CardType.Blurting,
      order: 2,
    });

    expect(
      needsPrimaryIntroduction([explain, quiz, blurting], new Map())
    ).toBe(true);

    const selected = selectCardForAtom({
      cards: [quiz, blurting, explain],
      atomState: makeUserAtomState({
        exposureCount: 4,
        correctAnswerCount: 3,
        mastery: 35,
        comprehensionLevel: 28,
      }),
      stage: CognitiveAtomStage.Consolidating,
      userCardStates: new Map(),
      lastCardType: CardType.Quiz,
    });

    expect(selected?.type).toBe(CardType.Explain);
  });

  it("suppresses explanation cards after they have already been viewed", () => {
    const explain = makeCard({
      id: "00000000-0000-4000-8000-000000000201" as CardId,
      type: CardType.Explain,
      order: 0,
    });
    const quiz = makeCard({
      id: "00000000-0000-4000-8000-000000000202" as CardId,
      type: CardType.Quiz,
      order: 1,
    });
    const blurting = makeCard({
      id: "00000000-0000-4000-8000-000000000203" as CardId,
      type: CardType.Blurting,
      order: 2,
    });

    const selected = selectCardForAtom({
      cards: [explain, quiz, blurting],
      atomState: makeUserAtomState({
        exposureCount: 1,
        correctAnswerCount: 1,
        wrongAnswerCount: 0,
      }),
      stage: CognitiveAtomStage.Learning,
      userCardStates: new Map([
        [explain.id, makeCardState(explain.id, 1)],
      ]),
      lastCardType: CardType.Explain,
    });

    expect(selected?.type).not.toBe(CardType.Explain);
  });

  it("prefers a quick quiz right after the explain card", () => {
    const explain = makeCard({
      id: "00000000-0000-4000-8000-000000000201" as CardId,
      type: CardType.Explain,
      order: 0,
    });
    const quiz = makeCard({
      id: "00000000-0000-4000-8000-000000000202" as CardId,
      type: CardType.Quiz,
      order: 1,
    });
    const blurting = makeCard({
      id: "00000000-0000-4000-8000-000000000203" as CardId,
      type: CardType.Blurting,
      order: 2,
    });

    const selected = selectCardForAtom({
      cards: [explain, quiz, blurting],
      atomState: makeUserAtomState({
        exposureCount: 1,
        correctAnswerCount: 0,
        wrongAnswerCount: 0,
      }),
      stage: CognitiveAtomStage.Learning,
      userCardStates: new Map([[explain.id, makeCardState(explain.id, 1)]]),
      lastCardType: CardType.Explain,
    });

    expect(selected?.type).toBe(CardType.Quiz);
  });

  it("re-shows explanation cards after wrong answers", () => {
    const explain = makeCard({
      id: "00000000-0000-4000-8000-000000000201" as CardId,
      type: CardType.Explain,
      order: 0,
    });
    const quiz = makeCard({
      id: "00000000-0000-4000-8000-000000000202" as CardId,
      type: CardType.Quiz,
      order: 1,
    });

    const selected = selectCardForAtom({
      cards: [quiz, explain],
      atomState: makeUserAtomState({
        exposureCount: 2,
        wrongAnswerCount: 2,
      }),
      stage: CognitiveAtomStage.Learning,
      userCardStates: new Map([
        [explain.id, makeCardState(explain.id, 1)],
      ]),
      lastCardType: CardType.Quiz,
    });

    expect(selected?.type).toBe(CardType.Explain);
  });

  it("never repeats the primary explain card after it was completed", () => {
    const explain = makeCard({
      id: "00000000-0000-4000-8000-000000000201" as CardId,
      type: CardType.Explain,
      order: 0,
    });
    const quiz = makeCard({
      id: "00000000-0000-4000-8000-000000000202" as CardId,
      type: CardType.Quiz,
      order: 1,
    });

    const selected = selectCardForAtom({
      cards: [explain, quiz],
      atomState: makeUserAtomState({
        exposureCount: 1,
        correctAnswerCount: 1,
        wrongAnswerCount: 0,
      }),
      stage: CognitiveAtomStage.Learning,
      userCardStates: new Map([
        [explain.id, makeCardState(explain.id, 1)],
      ]),
      lastCardType: CardType.Explain,
    });

    expect(selected?.id).toBe(quiz.id);
  });

  it("avoids repeating the same card type consecutively", () => {
    const quizA = makeCard({
      id: "00000000-0000-4000-8000-000000000201" as never,
      type: CardType.Quiz,
      order: 1,
    });
    const quizB = makeCard({
      id: "00000000-0000-4000-8000-000000000202" as never,
      type: CardType.Quiz,
      order: 2,
    });
    const trueFalse = makeCard({
      id: "00000000-0000-4000-8000-000000000203" as never,
      type: CardType.TrueFalse,
      order: 3,
    });

    const selected = selectCardForAtom({
      cards: [quizA, quizB, trueFalse],
      atomState: makeUserAtomState(),
      stage: CognitiveAtomStage.Consolidating,
      userCardStates: new Map(),
      lastCardType: CardType.Quiz,
    });

    expect(selected?.type).toBe(CardType.TrueFalse);
  });

  it("prefers quick retrieval cards over blurting after blurting", () => {
    const explain = makeCard({
      id: "00000000-0000-4000-8000-000000000201" as CardId,
      type: CardType.Explain,
      order: 0,
    });
    const quiz = makeCard({
      id: "00000000-0000-4000-8000-000000000202" as CardId,
      type: CardType.Quiz,
      order: 1,
    });
    const blurting = makeCard({
      id: "00000000-0000-4000-8000-000000000203" as CardId,
      type: CardType.Blurting,
      order: 2,
    });
    const feynman = makeCard({
      id: "00000000-0000-4000-8000-000000000204" as CardId,
      type: CardType.Feynman,
      order: 3,
    });

    const selected = selectCardForAtom({
      cards: [explain, quiz, blurting, feynman],
      atomState: makeUserAtomState({
        exposureCount: 2,
        correctAnswerCount: 2,
      }),
      stage: CognitiveAtomStage.Consolidating,
      userCardStates: new Map([
        [explain.id, makeCardState(explain.id, 1)],
        [blurting.id, makeCardState(blurting.id, 1)],
      ]),
      lastCardType: CardType.Blurting,
    });

    expect(selected?.type).toBe(CardType.Quiz);
  });
});
