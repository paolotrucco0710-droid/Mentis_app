import type {
  AtomId,
  AtomRelationshipId,
  KnowledgeSourceId,
  SubjectId,
} from "../ids";
import type {
  AbstractionLevel,
  DifficultyLevel,
  ImportanceLevel,
  LearningObjective,
  Score0To1,
} from "../enums";
import type {
  AtomRelationshipType,
  CognitiveDependencyStrength,
} from "../enums";

export interface AtomImageReference {
  imageId: import("../ids").ImageId;
  caption: string | null;
  description: string | null;
  referencedConcepts: string[];
}

/**
 * Persisted knowledge atom — immutable content (Invariant 2).
 * Progress lives in UserAtomState, never here.
 */
export interface Atom {
  id: AtomId;
  knowledgeSourceId: KnowledgeSourceId;
  subjectId: SubjectId;
  title: string;
  summary: string;
  explanation: string;
  importance: ImportanceLevel;
  difficulty: DifficultyLevel;
  abstractionLevel: AbstractionLevel;
  logicalOrder: number;
  originalOrder: number;
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
  images: AtomImageReference[];
  tables: string[];
  diagrams: string[];
  equations: string[];
  citations: string[];
  pageReferences: number[];
  confidence: Score0To1;
  aiVersion: string;
  tokensUsed: number | null;
  estimatedStudySeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AtomRelationship {
  id: AtomRelationshipId;
  sourceAtomId: AtomId;
  targetAtomId: AtomId;
  type: AtomRelationshipType;
  dependencyStrength: CognitiveDependencyStrength | null;
}
