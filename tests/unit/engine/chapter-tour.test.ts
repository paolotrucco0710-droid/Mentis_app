import { describe, expect, it } from "vitest";
import { CardType } from "@/domain/enums";
import {
  applyChapterTourVariety,
  countCardsSinceLastIntroduction,
  getIntroductionSpacing,
  resolvePostRetrievalFollowUp,
} from "@/engine/chapter-tour";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import { makeAtom, makeCard, makeUserAtomState } from "../../helpers/fixtures";
import type { AtomId, CardId } from "@/domain/ids";

function makeCandidate(atomId: AtomId, difficulty = 2, logicalOrder = 0) {
  return {
    atom: makeAtom({ id: atomId, difficulty, logicalOrder }),
    state: makeUserAtomState({ atomId, exposureCount: 1 }),
    stage: CognitiveAtomStage.Learning,
    priority: 50,
    forgetProbability: 0.2,
    prerequisitesMet: true,
    unlocksCount: 0,
  };
}

function makeExplainCard(atomId: AtomId, cardId: CardId) {
  return makeCard({ id: cardId, atomId, type: CardType.Explain, order: 0 });
}

describe("chapter-tour", () => {
  it("scales spacing with atom difficulty", () => {
    expect(getIntroductionSpacing(1)).toBe(1);
    expect(getIntroductionSpacing(3)).toBe(1);
    expect(getIntroductionSpacing(5)).toBe(2);
  });

  it("counts cards since the last introduction", () => {
    expect(
      countCardsSinceLastIntroduction([
        CardType.Explain,
        CardType.Quiz,
        CardType.TrueFalse,
      ])
    ).toBe(2);
  });

  it("interleaves practice from earlier atoms before the next introduction", () => {
    const first = makeCandidate(
      "00000000-0000-4000-8000-000000000101" as AtomId,
      2,
      0
    );
    const second = makeCandidate(
      "00000000-0000-4000-8000-000000000102" as AtomId,
      5,
      1
    );
    const firstCards = [
      makeExplainCard(first.atom.id, "00000000-0000-4000-8000-000000000201" as CardId),
      makeCard({
        id: "00000000-0000-4000-8000-000000000202" as CardId,
        atomId: first.atom.id,
        type: CardType.TrueFalse,
        order: 1,
      }),
    ];
    const secondCards = [
      makeExplainCard(second.atom.id, "00000000-0000-4000-8000-000000000203" as CardId),
      makeCard({
        id: "00000000-0000-4000-8000-000000000204" as CardId,
        atomId: second.atom.id,
        type: CardType.Quiz,
        order: 1,
      }),
    ];
    const third = makeCandidate(
      "00000000-0000-4000-8000-000000000103" as AtomId,
      3,
      2
    );
    const thirdCards = [
      makeExplainCard(third.atom.id, "00000000-0000-4000-8000-000000000205" as CardId),
    ];

    const filtered = applyChapterTourVariety([first, second, third], {
      recentAtomCounts: new Map([[second.atom.id, 1]]),
      recentAtomIds: [second.atom.id],
      recentCardTypes: [CardType.Explain],
      cardsByAtomId: new Map([
        [first.atom.id, firstCards],
        [second.atom.id, secondCards],
        [third.atom.id, thirdCards],
      ]),
      userCardStates: new Map([
        [
          firstCards[0]!.id,
          {
            userId: first.state.userId,
            cardId: firstCards[0]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 0,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        [
          secondCards[0]!.id,
          {
            userId: second.state.userId,
            cardId: secondCards[0]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 0,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      ]),
    }, second.atom.id);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.atom.id).toBe(first.atom.id);
  });

  it("blocks new introductions until spacing is satisfied for hard atoms", () => {
    const hard = makeCandidate(
      "00000000-0000-4000-8000-000000000101" as AtomId,
      5,
      0
    );
    const next = makeCandidate(
      "00000000-0000-4000-8000-000000000102" as AtomId,
      2,
      1
    );
    const hardCards = [
      makeExplainCard(hard.atom.id, "00000000-0000-4000-8000-000000000201" as CardId),
      makeCard({
        id: "00000000-0000-4000-8000-000000000202" as CardId,
        atomId: hard.atom.id,
        type: CardType.Quiz,
        order: 1,
      }),
    ];
    const nextCards = [
      makeExplainCard(next.atom.id, "00000000-0000-4000-8000-000000000203" as CardId),
    ];

    const filtered = applyChapterTourVariety([hard, next], {
      recentAtomCounts: new Map([[hard.atom.id, 1]]),
      recentAtomIds: [hard.atom.id],
      recentCardTypes: [CardType.Explain],
      cardsByAtomId: new Map([
        [hard.atom.id, hardCards],
        [next.atom.id, nextCards],
      ]),
      userCardStates: new Map([
        [
          hardCards[0]!.id,
          {
            userId: hard.state.userId,
            cardId: hardCards[0]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 0,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      ]),
    }, hard.atom.id);

    expect(filtered.some((candidate) => candidate.atom.id === next.atom.id)).toBe(
      false
    );
    expect(filtered[0]?.atom.id).toBe(hard.atom.id);
  });

  it("schedules blurting on the same atom immediately after a quiz", () => {
    const atom = makeCandidate(
      "00000000-0000-4000-8000-000000000101" as AtomId,
      2,
      0
    );
    const next = makeCandidate(
      "00000000-0000-4000-8000-000000000102" as AtomId,
      2,
      1
    );
    const atomCards = [
      makeExplainCard(atom.atom.id, "00000000-0000-4000-8000-000000000201" as CardId),
      makeCard({
        id: "00000000-0000-4000-8000-000000000202" as CardId,
        atomId: atom.atom.id,
        type: CardType.Quiz,
        order: 1,
      }),
      makeCard({
        id: "00000000-0000-4000-8000-000000000203" as CardId,
        atomId: atom.atom.id,
        type: CardType.Blurting,
        order: 2,
      }),
    ];
    const nextCards = [
      makeExplainCard(next.atom.id, "00000000-0000-4000-8000-000000000204" as CardId),
    ];

    const context = {
      recentAtomCounts: new Map([[atom.atom.id, 2]]),
      recentAtomIds: [atom.atom.id],
      recentCardTypes: [CardType.Quiz],
      cardsByAtomId: new Map([
        [atom.atom.id, atomCards],
        [next.atom.id, nextCards],
      ]),
      userCardStates: new Map([
        [
          atomCards[0]!.id,
          {
            userId: atom.state.userId,
            cardId: atomCards[0]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 0,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        [
          atomCards[1]!.id,
          {
            userId: atom.state.userId,
            cardId: atomCards[1]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 1,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      ]),
    };

    const followUp = resolvePostRetrievalFollowUp([atom, next], context, atom.atom.id);
    expect(followUp).toHaveLength(1);
    expect(followUp?.[0]?.atom.id).toBe(atom.atom.id);

    const filtered = applyChapterTourVariety([atom, next], context, atom.atom.id);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.atom.id).toBe(atom.atom.id);
  });
});
