import { z } from "zod";

const importanceSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const difficultySchema = importanceSchema;

const learningObjectiveSchema = z.enum([
  "know",
  "understand",
  "connect",
  "distinguish",
  "apply",
  "recall",
  "transfer",
]);

const atomImageSchema = z.object({
  imageId: z.string(),
  caption: z.string().nullable(),
  description: z.string().nullable(),
  referencedConcepts: z.array(z.string()),
});

export const knowledgeJsonAtomSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(300),
  explanation: z.string().min(1),
  importance: importanceSchema,
  difficulty: difficultySchema,
  prerequisites: z.array(z.string()),
  learningObjectives: z.array(learningObjectiveSchema).min(1),
  keywords: z.array(z.string()),
  aliases: z.array(z.string()),
  formulas: z.array(z.string()),
  definitions: z.array(z.string()),
  examples: z.array(z.string()),
  counterExamples: z.array(z.string()),
  commonMistakes: z.array(z.string()),
  misconceptions: z.array(z.string()),
  applications: z.array(z.string()),
  historicalContext: z.string().nullable(),
  notes: z.string().nullable(),
  images: z.array(atomImageSchema),
  tables: z.array(z.string()),
  diagrams: z.array(z.string()),
  equations: z.array(z.string()),
  citations: z.array(z.string()),
  pageReferences: z.array(z.number().int().positive()),
  confidence: z.number().min(0).max(1),
  quizDistractors: z.array(z.string().min(1)).max(3).optional(),
  errorDetectionStatement: z.string().min(12).max(220).optional(),
  errorDetectionCorrection: z.string().min(12).max(300).optional(),
});

export const knowledgeJsonSchema = z.object({
  metadata: z.object({
    documentId: z.string().min(1),
    title: z.string().min(1),
    subject: z.string().min(1),
    language: z.string().min(2),
    estimatedReadingTimeMinutes: z.number().int().nonnegative(),
    estimatedStudyTimeMinutes: z.number().int().nonnegative(),
    chapterNumber: z.number().int().positive().nullable(),
    sourcePages: z.number().int().positive(),
    generatedAt: z.string().min(1),
    version: z.string().min(1),
  }),
  atoms: z.array(knowledgeJsonAtomSchema).min(1),
});

export type ParsedKnowledgeJson = z.infer<typeof knowledgeJsonSchema>;
