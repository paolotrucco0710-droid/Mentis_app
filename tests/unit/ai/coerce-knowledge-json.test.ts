import { describe, expect, it } from "vitest";
import { coerceKnowledgeJson, extractJsonPayload } from "@/ai/coerce-knowledge-json";
import { knowledgeJsonSchema } from "@/ai/schema";

describe("coerceKnowledgeJson", () => {
  it("fills missing atom fields from partial LLM output", () => {
    const coerced = coerceKnowledgeJson({
      metadata: {
        title: "Capitolo 1",
        subject: "Storia",
      },
      atoms: [
        {
          title: "Rivoluzione francese",
          explanation: "Evento del 1789 che cambiò l'Europa.",
        },
      ],
    });

    const result = knowledgeJsonSchema.safeParse(coerced);
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.atoms[0].keywords).toEqual([]);
    expect(result.data.atoms[0].learningObjectives).toEqual(["understand"]);
    expect(result.data.atoms[0].pageReferences).toEqual([1]);
    expect(result.data.metadata.language).toBe("it");
  });

  it("accepts concepts instead of atoms", () => {
    const coerced = coerceKnowledgeJson({
      metadata: { title: "Test", subject: "Matematica", language: "it" },
      concepts: [
        {
          id: "atom-001",
          title: "Teorema",
          summary: "Riassunto",
          explanation: "Spiegazione completa",
          importance: "4",
          difficulty: 2,
        },
      ],
    });

    const result = knowledgeJsonSchema.safeParse(coerced);
    expect(result.success).toBe(true);
  });
});

describe("extractJsonPayload", () => {
  it("strips markdown fences", () => {
    expect(
      extractJsonPayload('```json\n{"atoms":[]}\n```')
    ).toBe('{"atoms":[]}');
  });
});
