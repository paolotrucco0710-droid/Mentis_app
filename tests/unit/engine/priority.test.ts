import { describe, expect, it } from "vitest";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import { UserAtomLearningState } from "@/domain/enums";
import {
  countUnlocks,
  scoreAtomCandidate,
  selectBestCandidate,
} from "@/engine/priority";
import { makeAtom, makeUserAtomState } from "../../helpers/fixtures";

describe("engine/priority", () => {
  it("returns null for locked atoms", () => {
    const atom = makeAtom({
      prerequisites: ["00000000-0000-4000-8000-000000000099"],
    });
    const state = makeUserAtomState();
    const now = new Date("2026-07-31T10:00:00.000Z");

    const scored = scoreAtomCandidate({
      atom,
      state,
      userAtomStates: new Map([[atom.id, state]]),
      unlocksCount: 0,
      now,
    });

    expect(scored).toBeNull();
  });

  it("prefers higher priority candidates", () => {
    const low = {
      atom: makeAtom({ id: "00000000-0000-4000-8000-000000000101" as never, logicalOrder: 2 }),
      state: makeUserAtomState({ atomId: "00000000-0000-4000-8000-000000000101" as never }),
      stage: CognitiveAtomStage.Learning,
      priority: 10,
      forgetProbability: 0.2,
      prerequisitesMet: true,
      unlocksCount: 0,
    };
    const high = {
      ...low,
      atom: makeAtom({ id: "00000000-0000-4000-8000-000000000102" as never, logicalOrder: 1 }),
      state: makeUserAtomState({ atomId: "00000000-0000-4000-8000-000000000102" as never }),
      priority: 90,
      forgetProbability: 0.8,
    };

    expect(selectBestCandidate([low, high])?.atom.id).toBe(high.atom.id);
  });

  it("counts unlockable dependents when prerequisite is mastered", () => {
    const prereqId = "00000000-0000-4000-8000-000000000100" as const;
    const dependent = makeAtom({
      id: "00000000-0000-4000-8000-000000000101" as never,
      prerequisites: [prereqId],
    });
    const states = new Map([
      [
        prereqId,
        makeUserAtomState({
          atomId: prereqId,
          mastery: 80,
          currentStage: UserAtomLearningState.Mastered,
        }),
      ],
      [
        dependent.id,
        makeUserAtomState({
          atomId: dependent.id,
          currentStage: UserAtomLearningState.Locked,
          mastery: 0,
        }),
      ],
    ]);

    expect(countUnlocks(prereqId, [dependent], states)).toBe(1);
  });
});
