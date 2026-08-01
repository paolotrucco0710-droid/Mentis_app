import { describe, expect, it } from "vitest";
import { buildExtractionSystemPrompt } from "@/ai/prompts";

describe("buildExtractionSystemPrompt", () => {
  it("includes required atom fields in the template", () => {
    const prompt = buildExtractionSystemPrompt();

    expect(prompt).toContain('"metadata"');
    expect(prompt).toContain('"learningObjectives"');
    expect(prompt).toContain('"pageReferences"');
    expect(prompt).toContain("TEMPLATE OBBLIGATORIO");
  });
});
