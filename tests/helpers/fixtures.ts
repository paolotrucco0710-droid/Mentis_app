import type { Atom, Card, UserAtomState } from "@/domain/entities";
import { CardType, CognitiveObjective, LearningObjective, UserAtomLearningState } from "@/domain/enums";
import type { AtomId, CardId, KnowledgeSourceId, SubjectId, UserId } from "@/domain/ids";

const USER_ID = "00000000-0000-4000-8000-000000000001" as UserId;
const SUBJECT_ID = "00000000-0000-4000-8000-000000000002" as SubjectId;
const SOURCE_ID = "00000000-0000-4000-8000-000000000010" as KnowledgeSourceId;

export function makeUserAtomState(
  overrides: Partial<UserAtomState> = {}
): UserAtomState {
  const now = new Date("2026-07-31T10:00:00.000Z");
  return {
    userId: USER_ID,
    atomId: "00000000-0000-4000-8000-000000000100" as AtomId,
    mastery: 20,
    confidence: 0.4,
    currentStage: UserAtomLearningState.Learning,
    exposureCount: 2,
    errorCount: 0,
    correctAnswerCount: 1,
    wrongAnswerCount: 1,
    lastViewedAt: now,
    nextReviewAt: null,
    averageResponseTimeMs: 8000,
    totalStudyTimeMs: 120_000,
    streak: 1,
    estimatedDecay: 0.2,
    comprehensionLevel: 35,
    lastAlgorithmUsed: "progress-v1",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeAtom(overrides: Partial<Atom> = {}): Atom {
  const now = new Date("2026-07-31T10:00:00.000Z");
  return {
    id: "00000000-0000-4000-8000-000000000100" as AtomId,
    knowledgeSourceId: SOURCE_ID,
    subjectId: SUBJECT_ID,
    title: "Concetto base",
    summary: "Riassunto",
    explanation: "Spiegazione",
    importance: 3,
    difficulty: 2,
    abstractionLevel: 2,
    logicalOrder: 1,
    originalOrder: 1,
    prerequisites: [],
    learningObjectives: [LearningObjective.Understand],
    keywords: ["test"],
    aliases: [],
    formulas: [],
    definitions: [],
    examples: [],
    counterExamples: [],
    commonMistakes: [],
    misconceptions: [],
    applications: [],
    historicalContext: null,
    notes: null,
    images: [],
    tables: [],
    diagrams: [],
    equations: [],
    citations: [],
    pageReferences: [1],
    confidence: 0.9,
    aiVersion: "1.0.0",
    tokensUsed: null,
    estimatedStudySeconds: 120,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeCard(overrides: Partial<Card> = {}): Card {
  const now = new Date("2026-07-31T10:00:00.000Z");
  return {
    id: "00000000-0000-4000-8000-000000000200" as CardId,
    atomId: "00000000-0000-4000-8000-000000000100" as AtomId,
    type: CardType.Quiz,
    order: 1,
    cognitiveObjective: CognitiveObjective.Retrieval,
    prompt: "Domanda?",
    text: "Testo card",
    explanation: null,
    correctFeedback: null,
    incorrectFeedback: null,
    estimatedDurationSeconds: 60,
    payload: {
      question: "Domanda?",
      options: ["A", "B"],
      correctOptionIndex: 0,
    },
    aiVersion: null,
    createdAt: now,
    ...overrides,
  };
}

export { USER_ID, SUBJECT_ID, SOURCE_ID };
