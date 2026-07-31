import { describe, expect, it } from "vitest";
import { validateKnowledgeSemantics } from "@/ai/validate";
import { makeKnowledgeJson } from "../../helpers/knowledge-json";

describe("ai/validate", () => {
  it("accepts valid knowledge graphs", () => {
    const result = validateKnowledgeSemantics(makeKnowledgeJson());
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects duplicate atom ids", () => {
    const knowledge = makeKnowledgeJson({
      atoms: [
        ...makeKnowledgeJson().atoms,
        { ...makeKnowledgeJson().atoms[0] },
      ],
    });

    const result = validateKnowledgeSemantics(knowledge);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("duplicati"))).toBe(
      true
    );
  });

  it("rejects dangling prerequisites", () => {
    const knowledge = makeKnowledgeJson({
      atoms: [
        {
          ...makeKnowledgeJson().atoms[1],
          prerequisites: ["missing-atom"],
        },
      ],
    });

    const result = validateKnowledgeSemantics(knowledge);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("inesistente"))).toBe(
      true
    );
  });

  it("rejects prerequisite cycles", () => {
    const knowledge = makeKnowledgeJson({
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
    });

    const result = validateKnowledgeSemantics(knowledge);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("ciclo"))).toBe(true);
  });
});
