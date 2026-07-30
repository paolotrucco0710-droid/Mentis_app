import type { AtomId } from "../ids";
import type {
  DifficultyLevel,
  ImportanceLevel,
  LearningObjective,
} from "../enums";
import type { Score0To1 } from "../enums";

/**
 * LLM output schema (Capitolo 4).
 * Describes knowledge only — no learning decisions, no UI data.
 */
export interface KnowledgeJsonMetadata {
  documentId: string;
  title: string;
  subject: string;
  language: string;
  estimatedReadingTimeMinutes: number;
  estimatedStudyTimeMinutes: number;
  chapterNumber: number | null;
  sourcePages: number;
  generatedAt: string;
  version: string;
}

export interface KnowledgeJsonAtomImage {
  imageId: string;
  caption: string | null;
  description: string | null;
  referencedConcepts: string[];
}

export interface KnowledgeJsonAtom {
  id: AtomId;
  title: string;
  summary: string;
  explanation: string;
  importance: ImportanceLevel;
  difficulty: DifficultyLevel;
  prerequisites: AtomId[];
  learningObjectives: LearningObjective[];
  keywords: string[];
  aliases: string[];
  formulas: string[];
  definitions: string[];
  examples: string[];
  counterExamples: string[];
  commonMistakes: string[];
  misconceptions: string[];
  applications: string[];
  historicalContext: string | null;
  notes: string | null;
  images: KnowledgeJsonAtomImage[];
  tables: string[];
  diagrams: string[];
  equations: string[];
  citations: string[];
  pageReferences: number[];
  confidence: Score0To1;
}

export interface KnowledgeJson {
  metadata: KnowledgeJsonMetadata;
  atoms: KnowledgeJsonAtom[];
}
