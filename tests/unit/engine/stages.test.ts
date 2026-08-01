import { describe, expect, it } from "vitest";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import { UserAtomLearningState } from "@/domain/enums";
import {
  initialLearningStage,
  prerequisitesMet,
  resolveCognitiveStage,
} from "@/engine/stages";
import { makeAtom, makeUserAtomState } from "../../helpers/fixtures";

describe("engine/stages", () => {
  it("requires all prerequisites to be mastered", () => {
    const prereqId = "00000000-0000-4000-8000-000000000099";
    const states = new Map([
      [
        prereqId,
        makeUserAtomState({
          atomId: prereqId as never,
          mastery: 40,
          currentStage: UserAtomLearningState.Learning,
        }),
      ],
    ]);

    expect(prerequisitesMet([prereqId], states)).toBe(false);
    expect(
      prerequisitesMet(
        [prereqId],
        new Map([
          [
            prereqId,
            makeUserAtomState({
              atomId: prereqId as never,
              mastery: 80,
              currentStage: UserAtomLearningState.Mastered,
            }),
          ],
        ])
      )
    ).toBe(true);
  });

  it("locks atoms when prerequisites are missing", () => {
    const now = new Date("2026-07-31T10:00:00.000Z");
    const state = makeUserAtomState();

    expect(
      resolveCognitiveStage(state, false, now)
    ).toBe(CognitiveAtomStage.Locked);
  });

  it("marks stable atoms when mastery threshold is reached", () => {
    const now = new Date("2026-07-31T10:00:00.000Z");
    const state = makeUserAtomState({
      mastery: 90,
      comprehensionLevel: 80,
      exposureCount: 5,
      estimatedDecay: 0.1,
      wrongAnswerCount: 0,
    });

    expect(resolveCognitiveStage(state, true, now)).toBe(
      CognitiveAtomStage.Stable
    );
  });

  it("moves to consolidating sooner after a correct retrieval answer", () => {
    const now = new Date("2026-07-31T10:00:00.000Z");
    const state = makeUserAtomState({
      mastery: 24,
      comprehensionLevel: 18,
      exposureCount: 1,
      correctAnswerCount: 1,
      wrongAnswerCount: 0,
      estimatedDecay: 0.2,
    });

    expect(resolveCognitiveStage(state, true, now)).toBe(
      CognitiveAtomStage.Consolidating
    );
  });

  it("returns locked initial stage when prerequisites are not satisfied", () => {
    expect(initialLearningStage(false)).toBe(UserAtomLearningState.Locked);
    expect(initialLearningStage(true)).toBe(UserAtomLearningState.Available);
  });

  it("uses atom prerequisites from fixture atom", () => {
    const atom = makeAtom({
      prerequisites: ["00000000-0000-4000-8000-000000000099"],
    });
    expect(atom.prerequisites).toHaveLength(1);
  });
});
