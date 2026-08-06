import { describe, expect, it } from "vitest";
import { CardType } from "@/domain/enums";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import { selectCardForAtom } from "@/engine/card-selector";
import { makeCard, makeUserAtomState } from "../../helpers/fixtures";
import type { AtomId, CardId } from "@/domain/ids";

describe("engine/connection cards", () => {
  it("surfaces connection cards only after both atoms are practiced", () => {
    const prerequisiteAtomId = "00000000-0000-4000-8000-000000000101" as AtomId;
    const dependentAtomId = "00000000-0000-4000-8000-000000000102" as AtomId;

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
    const connection = makeCard({
      id: "00000000-0000-4000-8000-000000000203" as CardId,
      type: CardType.Connection,
      order: 2,
      payload: {
        relatedAtomId: prerequisiteAtomId,
        relatedAtomTitle: "Cloroplasto",
        relationType: "prerequisite",
        question: "Come si lega «Fotosintesi» a «Cloroplasto»?",
        options: ["A", "B", "C", "D"],
        correctOptionIndex: 0,
      },
    });

    const userCardStates = new Map([
      [explain.id, { cardId: explain.id, viewCount: 1 }],
      [quiz.id, { cardId: quiz.id, viewCount: 1 }],
    ]) as never;

    const userAtomStates = new Map([
      [
        prerequisiteAtomId,
        makeUserAtomState({
          atomId: prerequisiteAtomId,
          exposureCount: 2,
          mastery: 30,
          correctAnswerCount: 1,
        }),
      ],
      [
        dependentAtomId,
        makeUserAtomState({
          atomId: dependentAtomId,
          exposureCount: 2,
          mastery: 35,
          correctAnswerCount: 1,
        }),
      ],
    ]);

    const selected = selectCardForAtom({
      cards: [explain, quiz, connection],
      atomState: userAtomStates.get(dependentAtomId)!,
      stage: CognitiveAtomStage.Consolidating,
      userCardStates,
      userAtomStates,
      lastCardType: CardType.Quiz,
      recentCardTypes: [CardType.Explain, CardType.Quiz],
    });

    expect(selected?.type).toBe(CardType.Connection);
  });

  it("suppresses connection cards before prerequisite practice", () => {
    const prerequisiteAtomId = "00000000-0000-4000-8000-000000000101" as AtomId;
    const dependentAtomId = "00000000-0000-4000-8000-000000000102" as AtomId;

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
    const connection = makeCard({
      id: "00000000-0000-4000-8000-000000000203" as CardId,
      type: CardType.Connection,
      order: 2,
      payload: {
        relatedAtomId: prerequisiteAtomId,
        relatedAtomTitle: "Cloroplasto",
        relationType: "prerequisite",
        question: "Come si lega «Fotosintesi» a «Cloroplasto»?",
        options: ["A", "B", "C", "D"],
        correctOptionIndex: 0,
      },
    });

    const userCardStates = new Map([
      [explain.id, { cardId: explain.id, viewCount: 1 }],
      [quiz.id, { cardId: quiz.id, viewCount: 1 }],
    ]) as never;

    const userAtomStates = new Map([
      [
        prerequisiteAtomId,
        makeUserAtomState({
          atomId: prerequisiteAtomId,
          exposureCount: 0,
          mastery: 0,
        }),
      ],
      [
        dependentAtomId,
        makeUserAtomState({
          atomId: dependentAtomId,
          exposureCount: 2,
          mastery: 35,
          correctAnswerCount: 1,
        }),
      ],
    ]);

    const selected = selectCardForAtom({
      cards: [explain, quiz, connection],
      atomState: userAtomStates.get(dependentAtomId)!,
      stage: CognitiveAtomStage.Consolidating,
      userCardStates,
      userAtomStates,
      lastCardType: CardType.Quiz,
      recentCardTypes: [CardType.Explain, CardType.Quiz],
    });

    expect(selected?.type).not.toBe(CardType.Connection);
  });
});
