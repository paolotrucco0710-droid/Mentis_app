import { describe, expect, it } from "vitest";
import { CognitiveAtomStage } from "@/domain/enums/cognitive";
import { filterCandidatesForSessionVariety } from "@/engine/session-variety";
import { makeAtom, makeUserAtomState } from "../../helpers/fixtures";
import type { AtomId } from "@/domain/ids";

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

describe("engine/session-variety", () => {
  it("prefers atoms never studied before repeating others", () => {
    const first = makeCandidate("00000000-0000-4000-8000-000000000101" as AtomId, {
      exposureCount: 2,
      logicalOrder: 0,
    });
    const second = makeCandidate("00000000-0000-4000-8000-000000000102" as AtomId, {
      exposureCount: 0,
      logicalOrder: 1,
    });

    const filtered = filterCandidatesForSessionVariety(
      [first, second],
      new Map([[first.atom.id, 2]])
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.atom.id).toBe(second.atom.id);
  });

  it("rotates fairly among atoms already introduced", () => {
    const first = makeCandidate("00000000-0000-4000-8000-000000000101" as AtomId, {
      exposureCount: 1,
    });
    const second = makeCandidate("00000000-0000-4000-8000-000000000102" as AtomId, {
      exposureCount: 1,
    });

    const filtered = filterCandidatesForSessionVariety(
      [first, second],
      new Map([
        [first.atom.id, 2],
        [second.atom.id, 0],
      ])
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.atom.id).toBe(second.atom.id);
  });

  it("prefers atoms under the per-session cap when others are saturated", () => {
    const first = makeCandidate("00000000-0000-4000-8000-000000000101" as AtomId, {
      exposureCount: 3,
    });
    const second = makeCandidate("00000000-0000-4000-8000-000000000102" as AtomId, {
      exposureCount: 3,
    });

    const filtered = filterCandidatesForSessionVariety(
      [first, second],
      new Map([
        [first.atom.id, 2],
        [second.atom.id, 1],
      ])
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.atom.id).toBe(second.atom.id);
  });
});
