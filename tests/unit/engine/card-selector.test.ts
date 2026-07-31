import { describe, expect, it } from "vitest";
import { CardType } from "@/domain/enums";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import { selectCardForAtom } from "@/engine/card-selector";
import { makeCard, makeUserAtomState } from "../../helpers/fixtures";

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
});
