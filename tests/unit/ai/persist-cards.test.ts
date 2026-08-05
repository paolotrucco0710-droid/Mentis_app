import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getGeneratedCardTypes } from "@/ai/persist";
import { deterministicShuffle } from "@/ai/deterministic-shuffle";
import { CardType } from "@/domain/enums";
import { makeMvpKnowledgeJson } from "../../helpers/mvp-knowledge";

describe("ai/persist MVP card generation", () => {
  it("shuffles quiz options deterministically for the same atom", () => {
    const items = ["A", "B", "C", "D"];
    const first = deterministicShuffle(items, "atom-seed");
    const second = deterministicShuffle(items, "atom-seed");

    expect(first).toEqual(second);
    expect(new Set(first)).toEqual(new Set(items));
  });

  it("generates all feed card types when an image reference exists", () => {
    const atom = makeMvpKnowledgeJson({
      imageId: "00000000-0000-4000-8000-000000000301",
      atomId: randomUUID(),
    }).atoms[0];

    expect(getGeneratedCardTypes(atom)).toEqual([
      CardType.Explain,
      CardType.Quiz,
      CardType.Blurting,
      CardType.TrueFalse,
      CardType.ErrorDetection,
      CardType.ImageExplain,
    ]);
  });

  it("omits image cards when no image reference is available", () => {
    const atom = makeMvpKnowledgeJson({ atomId: randomUUID() }).atoms[0];

    expect(getGeneratedCardTypes(atom)).not.toContain(CardType.ImageExplain);
    expect(getGeneratedCardTypes(atom)).not.toContain(CardType.Feynman);
    expect(getGeneratedCardTypes(atom)).toHaveLength(5);
  });
});
