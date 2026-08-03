import { describe, expect, it } from "vitest";
import { CardType } from "@/domain/enums";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import { filterCandidatesForSessionVariety } from "@/engine/session-variety";
import { makeAtom, makeCard, makeUserAtomState } from "../../helpers/fixtures";
import type { AtomId, CardId } from "@/domain/ids";

function makeCandidate(
  atomId: AtomId,
  input: {
    exposureCount?: number;
    logicalOrder?: number;
  } = {}
) {
  return {
    atom: makeAtom({
      id: atomId,
      logicalOrder: input.logicalOrder ?? 0,
    }),
    state: makeUserAtomState({
      atomId,
      exposureCount: input.exposureCount ?? 0,
    }),
    stage: CognitiveAtomStage.Learning,
    priority: 50,
    forgetProbability: 0.2,
    prerequisitesMet: true,
    unlocksCount: 0,
  };
}

function makeExplainCard(atomId: AtomId, cardId: CardId) {
  return makeCard({
    id: cardId,
    atomId,
    type: CardType.Explain,
    order: 0,
  });
}

describe("engine/session-variety", () => {
  it("requires quick verification before the next chapter introduction", () => {
    const introduced = makeCandidate("00000000-0000-4000-8000-000000000101" as AtomId, {
      exposureCount: 1,
      logicalOrder: 0,
    });
    const untouched = makeCandidate("00000000-0000-4000-8000-000000000102" as AtomId, {
      exposureCount: 0,
      logicalOrder: 1,
    });
    const introducedCards = [
      makeExplainCard(
        introduced.atom.id,
        "00000000-0000-4000-8000-000000000201" as CardId
      ),
      makeCard({
        id: "00000000-0000-4000-8000-000000000202" as CardId,
        atomId: introduced.atom.id,
        type: CardType.Quiz,
        order: 1,
      }),
    ];
    const untouchedCards = [
      makeExplainCard(
        untouched.atom.id,
        "00000000-0000-4000-8000-000000000203" as CardId
      ),
    ];

    const filtered = filterCandidatesForSessionVariety(
      [introduced, untouched],
      {
        recentAtomCounts: new Map([[introduced.atom.id, 1]]),
        recentAtomIds: [introduced.atom.id],
        recentCardTypes: [CardType.Explain],
        cardsByAtomId: new Map([
          [introduced.atom.id, introducedCards],
          [untouched.atom.id, untouchedCards],
        ]),
        userCardStates: new Map([
          [
            introducedCards[0]!.id,
            {
              userId: introduced.state.userId,
              cardId: introducedCards[0]!.id,
              viewCount: 1,
              wrongAnswerCount: 0,
              correctAnswerCount: 0,
              lastViewedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        ]),
      }
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.atom.id).toBe(introduced.atom.id);
  });

  it("prefers production cards over the next introduction when the session lacks them", () => {
    const introduced = makeCandidate("00000000-0000-4000-8000-000000000101" as AtomId, {
      exposureCount: 1,
      logicalOrder: 0,
    });
    const untouched = makeCandidate("00000000-0000-4000-8000-000000000102" as AtomId, {
      exposureCount: 0,
      logicalOrder: 1,
    });
    const introducedCards = [
      makeExplainCard(
        introduced.atom.id,
        "00000000-0000-4000-8000-000000000201" as CardId
      ),
      makeCard({
        id: "00000000-0000-4000-8000-000000000202" as CardId,
        atomId: introduced.atom.id,
        type: CardType.Quiz,
        order: 1,
      }),
      makeCard({
        id: "00000000-0000-4000-8000-000000000203" as CardId,
        atomId: introduced.atom.id,
        type: CardType.Blurting,
        order: 2,
      }),
    ];
    const untouchedCards = [
      makeExplainCard(
        untouched.atom.id,
        "00000000-0000-4000-8000-000000000204" as CardId
      ),
    ];

    const filtered = filterCandidatesForSessionVariety(
      [introduced, untouched],
      {
        recentAtomCounts: new Map([[introduced.atom.id, 1]]),
        recentAtomIds: [introduced.atom.id],
        recentCardTypes: [CardType.Explain, CardType.Quiz],
        cardsByAtomId: new Map([
          [introduced.atom.id, introducedCards],
          [untouched.atom.id, untouchedCards],
        ]),
        userCardStates: new Map([
          [
            introducedCards[0]!.id,
            {
              userId: introduced.state.userId,
              cardId: introducedCards[0]!.id,
              viewCount: 1,
              wrongAnswerCount: 0,
              correctAnswerCount: 0,
              lastViewedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          [
            introducedCards[1]!.id,
            {
              userId: introduced.state.userId,
              cardId: introducedCards[1]!.id,
              viewCount: 1,
              wrongAnswerCount: 0,
              correctAnswerCount: 1,
              lastViewedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        ]),
      }
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.atom.id).toBe(introduced.atom.id);
  });

  it("prioritizes the next chapter introduction after production and retrieval variety", () => {
    const introduced = makeCandidate("00000000-0000-4000-8000-000000000101" as AtomId, {
      exposureCount: 1,
      logicalOrder: 0,
    });
    const untouched = makeCandidate("00000000-0000-4000-8000-000000000102" as AtomId, {
      exposureCount: 0,
      logicalOrder: 1,
    });
    const introducedCards = [
      makeExplainCard(
        introduced.atom.id,
        "00000000-0000-4000-8000-000000000201" as CardId
      ),
      makeCard({
        id: "00000000-0000-4000-8000-000000000202" as CardId,
        atomId: introduced.atom.id,
        type: CardType.Quiz,
        order: 1,
      }),
    ];
    const untouchedCards = [
      makeExplainCard(
        untouched.atom.id,
        "00000000-0000-4000-8000-000000000203" as CardId
      ),
    ];

    const filtered = filterCandidatesForSessionVariety(
      [introduced, untouched],
      {
        recentAtomCounts: new Map([[introduced.atom.id, 1]]),
        recentAtomIds: [introduced.atom.id],
        recentCardTypes: [CardType.Explain, CardType.Quiz, CardType.Blurting],
        cardsByAtomId: new Map([
          [introduced.atom.id, introducedCards],
          [untouched.atom.id, untouchedCards],
        ]),
        userCardStates: new Map([
          [
            introducedCards[0]!.id,
            {
              userId: introduced.state.userId,
              cardId: introducedCards[0]!.id,
              viewCount: 1,
              wrongAnswerCount: 0,
              correctAnswerCount: 0,
              lastViewedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          [
            introducedCards[1]!.id,
            {
              userId: introduced.state.userId,
              cardId: introducedCards[1]!.id,
              viewCount: 1,
              wrongAnswerCount: 0,
              correctAnswerCount: 1,
              lastViewedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        ]),
      }
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.atom.id).toBe(untouched.atom.id);
  });

  it("keeps the explained atom for verification even when another atom can be practiced", () => {
    const introduced = makeCandidate("00000000-0000-4000-8000-000000000101" as AtomId, {
      exposureCount: 1,
      logicalOrder: 0,
    });
    const practiced = makeCandidate("00000000-0000-4000-8000-000000000102" as AtomId, {
      exposureCount: 1,
      logicalOrder: 1,
    });
    const introducedCards = [
      makeExplainCard(
        introduced.atom.id,
        "00000000-0000-4000-8000-000000000201" as CardId
      ),
      makeCard({
        id: "00000000-0000-4000-8000-000000000202" as CardId,
        atomId: introduced.atom.id,
        type: CardType.Quiz,
        order: 1,
      }),
    ];
    const practicedCards = [
      makeExplainCard(
        practiced.atom.id,
        "00000000-0000-4000-8000-000000000203" as CardId
      ),
      makeCard({
        id: "00000000-0000-4000-8000-000000000204" as CardId,
        atomId: practiced.atom.id,
        type: CardType.TrueFalse,
        order: 1,
      }),
    ];

    const filtered = filterCandidatesForSessionVariety(
      [introduced, practiced],
      {
        recentAtomCounts: new Map([[introduced.atom.id, 1]]),
        recentAtomIds: [introduced.atom.id],
        recentCardTypes: [CardType.Explain],
        cardsByAtomId: new Map([
          [introduced.atom.id, introducedCards],
          [practiced.atom.id, practicedCards],
        ]),
        userCardStates: new Map([
          [
            introducedCards[0]!.id,
            {
              userId: introduced.state.userId,
              cardId: introducedCards[0]!.id,
              viewCount: 1,
              wrongAnswerCount: 0,
              correctAnswerCount: 0,
              lastViewedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          [
            practicedCards[0]!.id,
            {
              userId: practiced.state.userId,
              cardId: practicedCards[0]!.id,
              viewCount: 1,
              wrongAnswerCount: 0,
              correctAnswerCount: 0,
              lastViewedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        ]),
      }
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.atom.id).toBe(introduced.atom.id);
  });

  it("keeps practice atoms available after a quick quiz instead of forcing only new introductions", () => {
    const first = makeCandidate("00000000-0000-4000-8000-000000000101" as AtomId, {
      exposureCount: 1,
    });
    const second = makeCandidate("00000000-0000-4000-8000-000000000102" as AtomId, {
      exposureCount: 0,
    });
    const third = makeCandidate("00000000-0000-4000-8000-000000000103" as AtomId, {
      exposureCount: 1,
    });
    const firstCards = [
      makeExplainCard(first.atom.id, "00000000-0000-4000-8000-000000000201" as CardId),
      makeCard({
        id: "00000000-0000-4000-8000-000000000202" as CardId,
        atomId: first.atom.id,
        type: CardType.Quiz,
        order: 1,
      }),
    ];
    const thirdCards = [
      makeExplainCard(third.atom.id, "00000000-0000-4000-8000-000000000205" as CardId),
      makeCard({
        id: "00000000-0000-4000-8000-000000000206" as CardId,
        atomId: third.atom.id,
        type: CardType.TrueFalse,
        order: 1,
      }),
    ];

    const filtered = filterCandidatesForSessionVariety([first, second, third], {
      recentAtomCounts: new Map([[first.atom.id, 2]]),
      recentAtomIds: [first.atom.id],
      recentCardTypes: [CardType.Explain, CardType.Quiz],
      cardsByAtomId: new Map([
        [first.atom.id, firstCards],
        [
          second.atom.id,
          [makeExplainCard(second.atom.id, "00000000-0000-4000-8000-000000000204" as CardId)],
        ],
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
          firstCards[1]!.id,
          {
            userId: first.state.userId,
            cardId: firstCards[1]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 1,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        [
          thirdCards[0]!.id,
          {
            userId: third.state.userId,
            cardId: thirdCards[0]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 0,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      ]),
    });

    expect(filtered.some((candidate) => candidate.atom.id === second.atom.id)).toBe(
      true
    );
    expect(filtered.some((candidate) => candidate.atom.id === first.atom.id)).toBe(
      false
    );
  });

  it("allows a new introduction only after the previous learn card", () => {
    const first = makeCandidate("00000000-0000-4000-8000-000000000101" as AtomId, {
      exposureCount: 0,
    });
    const second = makeCandidate("00000000-0000-4000-8000-000000000102" as AtomId, {
      exposureCount: 0,
    });

    const filtered = filterCandidatesForSessionVariety([first, second], {
      recentAtomCounts: new Map(),
      recentCardTypes: [CardType.Quiz],
      cardsByAtomId: new Map([
        [
          first.atom.id,
          [makeExplainCard(first.atom.id, "00000000-0000-4000-8000-000000000201" as CardId)],
        ],
        [
          second.atom.id,
          [makeExplainCard(second.atom.id, "00000000-0000-4000-8000-000000000202" as CardId)],
        ],
      ]),
      userCardStates: new Map(),
    });

    expect(filtered).toHaveLength(2);
  });

  it("moves to the next introduction only after the previous learn card was verified", () => {
    const introduced = makeCandidate("00000000-0000-4000-8000-000000000101" as AtomId, {
      exposureCount: 1,
    });
    const untouched = makeCandidate("00000000-0000-4000-8000-000000000102" as AtomId, {
      exposureCount: 0,
    });
    const introducedCards = [
      makeExplainCard(
        introduced.atom.id,
        "00000000-0000-4000-8000-000000000201" as CardId
      ),
      makeCard({
        id: "00000000-0000-4000-8000-000000000202" as CardId,
        atomId: introduced.atom.id,
        type: CardType.Blurting,
        order: 1,
      }),
    ];

    const filtered = filterCandidatesForSessionVariety([introduced, untouched], {
      recentAtomCounts: new Map([[introduced.atom.id, 1]]),
      recentAtomIds: [introduced.atom.id],
      recentCardTypes: [CardType.Explain],
      cardsByAtomId: new Map([
        [introduced.atom.id, introducedCards],
        [
          untouched.atom.id,
          [makeExplainCard(untouched.atom.id, "00000000-0000-4000-8000-000000000203" as CardId)],
        ],
      ]),
      userCardStates: new Map([
        [
          introducedCards[0]!.id,
          {
            userId: introduced.state.userId,
            cardId: introducedCards[0]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 0,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      ]),
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.atom.id).toBe(introduced.atom.id);
  });

  it("rotates fairly among atoms already introduced", () => {
    const first = makeCandidate("00000000-0000-4000-8000-000000000101" as AtomId, {
      exposureCount: 2,
    });
    const second = makeCandidate("00000000-0000-4000-8000-000000000102" as AtomId, {
      exposureCount: 2,
    });
    const firstCards = [
      makeExplainCard(first.atom.id, "00000000-0000-4000-8000-000000000201" as CardId),
      makeCard({
        id: "00000000-0000-4000-8000-000000000202" as CardId,
        atomId: first.atom.id,
        type: CardType.Quiz,
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

    const filtered = filterCandidatesForSessionVariety([first, second], {
      recentAtomCounts: new Map([
        [first.atom.id, 2],
        [second.atom.id, 0],
      ]),
      recentCardTypes: [CardType.Quiz, CardType.Blurting],
      cardsByAtomId: new Map([
        [first.atom.id, firstCards],
        [second.atom.id, secondCards],
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
          firstCards[1]!.id,
          {
            userId: first.state.userId,
            cardId: firstCards[1]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 1,
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
        [
          secondCards[1]!.id,
          {
            userId: second.state.userId,
            cardId: secondCards[1]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 1,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      ]),
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.atom.id).toBe(second.atom.id);
  });

  it("prioritizes atoms with unseen blurting or feynman when the session lacks production cards", () => {
    const practiced = makeCandidate("00000000-0000-4000-8000-000000000101" as AtomId, {
      exposureCount: 2,
    });
    const productionDue = makeCandidate("00000000-0000-4000-8000-000000000102" as AtomId, {
      exposureCount: 2,
    });
    const practicedCards = [
      makeExplainCard(practiced.atom.id, "00000000-0000-4000-8000-000000000201" as CardId),
      makeCard({
        id: "00000000-0000-4000-8000-000000000202" as CardId,
        atomId: practiced.atom.id,
        type: CardType.Quiz,
        order: 1,
      }),
    ];
    const productionCards = [
      makeExplainCard(
        productionDue.atom.id,
        "00000000-0000-4000-8000-000000000203" as CardId
      ),
      makeCard({
        id: "00000000-0000-4000-8000-000000000204" as CardId,
        atomId: productionDue.atom.id,
        type: CardType.Quiz,
        order: 1,
      }),
      makeCard({
        id: "00000000-0000-4000-8000-000000000205" as CardId,
        atomId: productionDue.atom.id,
        type: CardType.Blurting,
        order: 2,
      }),
    ];

    const filtered = filterCandidatesForSessionVariety([practiced, productionDue], {
      recentAtomCounts: new Map([
        [practiced.atom.id, 1],
        [productionDue.atom.id, 1],
      ]),
      recentCardTypes: [
        CardType.Explain,
        CardType.Quiz,
        CardType.TrueFalse,
        CardType.Quiz,
        CardType.ErrorDetection,
      ],
      cardsByAtomId: new Map([
        [practiced.atom.id, practicedCards],
        [productionDue.atom.id, productionCards],
      ]),
      userCardStates: new Map([
        [
          practicedCards[0]!.id,
          {
            userId: practiced.state.userId,
            cardId: practicedCards[0]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 0,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        [
          practicedCards[1]!.id,
          {
            userId: practiced.state.userId,
            cardId: practicedCards[1]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 1,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        [
          productionCards[0]!.id,
          {
            userId: productionDue.state.userId,
            cardId: productionCards[0]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 0,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        [
          productionCards[1]!.id,
          {
            userId: productionDue.state.userId,
            cardId: productionCards[1]!.id,
            viewCount: 1,
            wrongAnswerCount: 0,
            correctAnswerCount: 1,
            lastViewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      ]),
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.atom.id).toBe(productionDue.atom.id);
  });
});
