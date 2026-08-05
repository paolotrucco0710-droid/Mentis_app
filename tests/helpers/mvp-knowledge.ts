import type { ParsedKnowledgeJson } from "@/ai/schema";
import { CardType } from "@/domain/enums";

export const MVP_ATOM_ID = "00000000-0000-4000-8000-000000000101";
export const MVP_DEMO_KNOWLEDGE_SOURCE_ID =
  "00000000-0000-4000-8000-000000000201";

export function makeMvpKnowledgeJson(input?: {
  imageId?: string;
  atomId?: string;
}): ParsedKnowledgeJson {
  const atomId = input?.atomId ?? MVP_ATOM_ID;

  return {
    metadata: {
      documentId: "mvp-demo-doc",
      title: "Capitolo demo MVP",
      subject: "Generale",
      language: "it",
      estimatedReadingTimeMinutes: 5,
      estimatedStudyTimeMinutes: 10,
      chapterNumber: 1,
      sourcePages: 1,
      generatedAt: "2026-07-31T10:00:00.000Z",
      version: "1.0.0",
    },
    atoms: [
      {
        id: atomId,
        title: "Fotosintesi clorofilliana",
        summary:
          "Processo con cui le piante convertono luce e CO₂ in energia chimica.",
        explanation:
          "La fotosintesi avviene nei cloroplasti e produce glucosio e ossigeno.",
        importance: 4,
        difficulty: 2,
        prerequisites: [],
        learningObjectives: ["understand", "apply"],
        keywords: ["fotosintesi", "clorofilla", "glucosio"],
        aliases: ["fotosintesi"],
        formulas: ["6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂"],
        definitions: [
          "La fotosintesi è la conversione di energia luminosa in energia chimica.",
        ],
        examples: [
          "Le foglie verdi assorbono la luce solare per produrre zuccheri.",
        ],
        counterExamples: ["La respirazione cellulare consuma ossigeno."],
        commonMistakes: [
          "Le piante producono ossigeno solo di notte durante la fotosintesi.",
        ],
        misconceptions: [
          "La fotosintesi avviene solo nelle radici delle piante.",
        ],
        applications: ["Agricoltura", "Ecologia"],
        historicalContext: null,
        notes: null,
        images: input?.imageId
          ? [
              {
                imageId: input.imageId,
                caption: "Schema della fotosintesi",
                description: "Rappresentazione del processo nei cloroplasti.",
                referencedConcepts: ["clorofilla", "glucosio"],
              },
            ]
          : [],
        tables: [],
        diagrams: [],
        equations: [],
        citations: [],
        pageReferences: [1],
        confidence: 0.95,
      },
    ],
  };
}

export const MVP_REQUIRED_CARD_TYPES = [
  CardType.Explain,
  CardType.Quiz,
  CardType.Blurting,
  CardType.TrueFalse,
  CardType.ErrorDetection,
  CardType.ImageExplain,
] as const;
