import { describe, expect, it } from "vitest";
import { CardType } from "@/domain/enums";
import { SessionEventOutcome } from "@/domain/enums";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import { selectCardForAtom } from "@/engine/card-selector";
import { prerequisitesMet } from "@/engine/stages";
import { validateKnowledgeSemantics } from "@/ai/validate";
import {
  applyMasteryUpdate,
  computeMasteryUpdate,
} from "@/progress/mastery";
import { makeAtom, makeCard, makeUserAtomState } from "../helpers/fixtures";
import { makeKnowledgeJson } from "../helpers/knowledge-json";

describe("regression/cognitive-engine", () => {
  it("keeps prerequisite gating stable across milestones", () => {
    const prereqId = "00000000-0000-4000-8000-000000000099";
    const dependent = makeAtom({ prerequisites: [prereqId] });
    const states = new Map([
      [
        prereqId,
        makeUserAtomState({
          atomId: prereqId as never,
          mastery: 30,
        }),
      ],
    ]);

    expect(prerequisitesMet(dependent.prerequisites, states)).toBe(false);
  });

  it("keeps mastery progression stable for quiz success path", () => {
    const atomState = makeUserAtomState({ mastery: 35, streak: 2 });
    const update = computeMasteryUpdate({
      card: makeCard({ type: CardType.Quiz }),
      atomState,
      outcome: SessionEventOutcome.Success,
      isCorrect: true,
      responseTimeMs: 2500,
    });
    const patched = applyMasteryUpdate(atomState, update);

    expect(patched.mastery).toBeGreaterThanOrEqual(43);
    expect(patched.streak).toBe(3);
  });

  it("keeps learning-stage card variety behavior", () => {
    const selected = selectCardForAtom({
      cards: [
        makeCard({
          id: "00000000-0000-4000-8000-000000000201" as never,
          type: CardType.Quiz,
          order: 1,
        }),
        makeCard({
          id: "00000000-0000-4000-8000-000000000202" as never,
          type: CardType.Explain,
          order: 2,
        }),
      ],
      atomState: makeUserAtomState({ exposureCount: 0 }),
      stage: CognitiveAtomStage.Learning,
      userCardStates: new Map(),
      lastCardType: null,
    });

    expect(selected?.type).toBe(CardType.Explain);
  });

  it("keeps AI semantic validation guardrails", () => {
    const invalid = validateKnowledgeSemantics(
      makeKnowledgeJson({
        atoms: [
          {
            ...makeKnowledgeJson().atoms[0],
            id: "atom-a",
            prerequisites: ["atom-b"],
          },
          {
            ...makeKnowledgeJson().atoms[1],
            id: "atom-b",
            prerequisites: ["atom-a"],
          },
        ],
      })
    );

    expect(invalid.ok).toBe(false);
  });
});
