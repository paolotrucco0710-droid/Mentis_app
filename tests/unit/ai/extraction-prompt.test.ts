import { describe, expect, it } from "vitest";
import { buildExtractionSystemPrompt, buildExtractionUserPrompt } from "@/ai/prompts";

describe("buildExtractionSystemPrompt", () => {
  it("includes atom granularity rules from master context", () => {
    const prompt = buildExtractionSystemPrompt();

    expect(prompt).toContain("UNA sola idea");
    expect(prompt).toContain("Contesto di...");
    expect(prompt).toContain("definitions");
    expect(prompt).toContain("20-60 secondi");
    expect(prompt).toContain("8-15 Atom");
  });

  it("shows a concrete atom example with a short title", () => {
    const prompt = buildExtractionSystemPrompt();

    expect(prompt).toContain('"title": "Reconquista"');
    expect(prompt).toContain("Esempi BUONI");
    expect(prompt).toContain("Esempi CATTIVI");
  });
});

describe("buildExtractionUserPrompt", () => {
  it("reinforces atomic decomposition in the user message", () => {
    const prompt = buildExtractionUserPrompt(
      "Le crociate",
      "Storia",
      "it",
      "Testo breve"
    );

    expect(prompt).toContain("Scomponi il capitolo in Atom piccoli");
    expect(prompt).toContain("Evita titoli");
  });
});
