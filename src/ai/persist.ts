import { CardType, CognitiveObjective } from "@/domain/enums";
import type { KnowledgeJson } from "@/domain/knowledge";
import type { AtomId, KnowledgeSourceId, SubjectId } from "@/domain/ids";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/client";
import { env } from "@/lib/env";
import { shouldCreateImageExplainCard } from "./image-study";
import {
  buildErrorDetectionContent,
} from "./error-detection-options";
import { buildConnectionCardsForAtom } from "./connection-card-builder";
import { buildImageExplainCardCreateInput } from "./image-explain-card-builder";
import { deterministicShuffle } from "./deterministic-shuffle";
import { buildBlurtingKeyPoints, buildBlurtingMainPrompt, buildTrueFalseCards } from "./micro-cards";
import { buildQuizOptions, buildSecondaryQuiz } from "./quiz-options";
import { compactPhrase } from "./text-snippets";

export interface PersistResult {
  atomCount: number;
  cardCount: number;
}

const PERSIST_TRANSACTION_OPTIONS = {
  maxWait: 15_000,
  timeout: 120_000,
} as const;

function buildAtomRows(
  knowledge: KnowledgeJson,
  knowledgeSourceId: KnowledgeSourceId,
  subjectId: SubjectId
): Prisma.AtomCreateManyInput[] {
  return knowledge.atoms.map((atom, index) => ({
    id: atom.id,
    knowledgeSourceId,
    subjectId,
    title: atom.title,
    summary: atom.summary,
    explanation: atom.explanation,
    importance: atom.importance,
    difficulty: atom.difficulty,
    abstractionLevel: 3,
    logicalOrder: index,
    originalOrder: index,
    learningObjectives: atom.learningObjectives,
    keywords: atom.keywords,
    aliases: atom.aliases,
    formulas: atom.formulas,
    definitions: atom.definitions,
    examples: atom.examples,
    counterExamples: atom.counterExamples,
    commonMistakes: atom.commonMistakes,
    misconceptions: atom.misconceptions,
    applications: atom.applications,
    historicalContext: atom.historicalContext,
    notes: atom.notes,
    images: atom.images as unknown as Prisma.InputJsonValue,
    tables: atom.tables,
    diagrams: atom.diagrams,
    equations: atom.equations,
    citations: atom.citations,
    pageReferences: atom.pageReferences,
    confidence: atom.confidence,
    aiVersion: env.aiPromptVersion,
    tokensUsed: null,
    estimatedStudySeconds: 45,
  }));
}

function buildPrerequisiteRows(
  knowledge: KnowledgeJson
): Prisma.AtomPrerequisiteCreateManyInput[] {
  return knowledge.atoms.flatMap((atom) =>
    atom.prerequisites.map((prerequisiteAtomId) => ({
      atomId: atom.id,
      prerequisiteAtomId,
    }))
  );
}

export async function persistKnowledgeGraph(input: {
  knowledge: KnowledgeJson;
  knowledgeSourceId: KnowledgeSourceId;
  subjectId: SubjectId;
}): Promise<PersistResult> {
  const { knowledge, knowledgeSourceId, subjectId } = input;
  const atomRows = buildAtomRows(knowledge, knowledgeSourceId, subjectId);
  const prerequisiteRows = buildPrerequisiteRows(knowledge);
  const cardRows = knowledge.atoms.flatMap((atom) =>
    buildCardsForAtom(atom.id, atom, knowledge.atoms)
  );

  return prisma.$transaction(async (tx) => {
    await tx.card.deleteMany({
      where: { atom: { knowledgeSourceId } },
    });
    await tx.atomPrerequisite.deleteMany({
      where: { atom: { knowledgeSourceId } },
    });
    await tx.atom.deleteMany({ where: { knowledgeSourceId } });

    if (atomRows.length > 0) {
      await tx.atom.createMany({ data: atomRows });
    }

    if (prerequisiteRows.length > 0) {
      await tx.atomPrerequisite.createMany({ data: prerequisiteRows });
    }

    if (cardRows.length > 0) {
      await tx.card.createMany({ data: cardRows });
    }

    return {
      atomCount: knowledge.atoms.length,
      cardCount: cardRows.length,
    };
  }, PERSIST_TRANSACTION_OPTIONS);
}

function buildCardsForAtom(
  atomId: AtomId,
  atom: KnowledgeJson["atoms"][number],
  allAtoms: KnowledgeJson["atoms"]
): Prisma.CardCreateManyInput[] {
  const cards: Prisma.CardCreateManyInput[] = [];
  let order = 0;

  const sourceContext = {
    title: atom.title,
    summary: atom.summary,
    explanation: atom.explanation,
    misconceptions: atom.misconceptions ?? [],
    commonMistakes: atom.commonMistakes ?? [],
    definitions: atom.definitions ?? [],
    examples: atom.examples ?? [],
    counterExamples: atom.counterExamples ?? [],
  };

  cards.push({
    atomId,
    type: CardType.Explain,
    order: order++,
    cognitiveObjective: CognitiveObjective.Comprehension,
    prompt: atom.title,
    text: compactPhrase(atom.summary, 120),
    explanation: compactPhrase(atom.explanation, 280),
    correctFeedback: "Ottimo, continua così.",
    estimatedDurationSeconds: 30,
    aiVersion: env.aiPromptVersion,
  });

  const quiz = buildQuizOptions(
    {
      id: atomId,
      title: atom.title,
      summary: atom.summary,
      definitions: atom.definitions,
      quizDistractors: atom.quizDistractors,
      misconceptions: atom.misconceptions,
      counterExamples: atom.counterExamples,
      commonMistakes: atom.commonMistakes,
    },
    deterministicShuffle
  );

  cards.push({
    atomId,
    type: CardType.Quiz,
    order: order++,
    cognitiveObjective: CognitiveObjective.Retrieval,
    prompt: quiz.question,
    text: quiz.question,
    explanation: compactPhrase(atom.explanation, 200),
    correctFeedback: "Risposta corretta.",
    incorrectFeedback: compactPhrase(atom.summary, 120),
    estimatedDurationSeconds: 20,
    payload: {
      question: quiz.question,
      options: quiz.options,
      correctOptionIndex: quiz.correctOptionIndex,
    } as Prisma.InputJsonValue,
    aiVersion: env.aiPromptVersion,
  });

  const primaryCorrect =
    quiz.options[quiz.correctOptionIndex] ?? compactPhrase(atom.summary, 120);
  const secondaryQuiz = buildSecondaryQuiz(
    {
      id: atomId,
      title: atom.title,
      summary: atom.summary,
      definitions: atom.definitions,
      quizDistractors: atom.quizDistractors,
      misconceptions: atom.misconceptions,
      counterExamples: atom.counterExamples,
      commonMistakes: atom.commonMistakes,
    },
    deterministicShuffle,
    primaryCorrect
  );

  if (secondaryQuiz) {
    cards.push({
      atomId,
      type: CardType.Quiz,
      order: order++,
      cognitiveObjective: CognitiveObjective.Retrieval,
      prompt: secondaryQuiz.question,
      text: secondaryQuiz.question,
      explanation: compactPhrase(atom.explanation, 200),
      correctFeedback: "Risposta corretta.",
      incorrectFeedback: compactPhrase(atom.summary, 120),
      estimatedDurationSeconds: 20,
      payload: {
        question: secondaryQuiz.question,
        options: secondaryQuiz.options,
        correctOptionIndex: secondaryQuiz.correctOptionIndex,
      } as Prisma.InputJsonValue,
      aiVersion: env.aiPromptVersion,
    });
  }

  const trueFalseCards = buildTrueFalseCards(sourceContext);
  const usedStatements: string[] = [];

  for (const trueFalse of trueFalseCards) {
    usedStatements.push(trueFalse.statement);
    cards.push({
      atomId,
      type: CardType.TrueFalse,
      order: order++,
      cognitiveObjective: CognitiveObjective.Connection,
      prompt: "Vero o falso?",
      text: trueFalse.statement,
      explanation: compactPhrase(atom.explanation, 200),
      correctFeedback: "Esatto.",
      incorrectFeedback: compactPhrase(atom.summary, 120),
      estimatedDurationSeconds: 15,
      payload: {
        statement: trueFalse.statement,
        correctAnswer: trueFalse.correctAnswer,
      } as Prisma.InputJsonValue,
      aiVersion: env.aiPromptVersion,
    });
  }

  const errorDetection = buildErrorDetectionContent(sourceContext, {
    excludeStatements: usedStatements,
  });

  if (errorDetection) {
    cards.push({
      atomId,
      type: CardType.ErrorDetection,
      order: order++,
      cognitiveObjective: CognitiveObjective.Connection,
      prompt: "Trova l'errore nel testo.",
      text: errorDetection.flawedText,
      explanation: compactPhrase(atom.explanation, 200),
      correctFeedback: "Hai individuato l'errore.",
      incorrectFeedback: errorDetection.correction,
      estimatedDurationSeconds: 25,
      payload: {
        text: errorDetection.flawedText,
        errorIndices: errorDetection.flawedText.length > 0 ? [0] : [],
        correction: errorDetection.correction,
      } as Prisma.InputJsonValue,
      aiVersion: env.aiPromptVersion,
    });
  }

  const blurtingKeyPoints = buildBlurtingKeyPoints({
    ...sourceContext,
    keywords: atom.keywords,
  });
  const blurtingPrompt = buildBlurtingMainPrompt({
    ...sourceContext,
    keywords: atom.keywords,
  });

  cards.push({
    atomId,
    type: CardType.Blurting,
    order: order++,
    cognitiveObjective: CognitiveObjective.Retrieval,
    prompt: blurtingPrompt,
    text: `Blurting: ${atom.title}`,
    explanation: compactPhrase(atom.explanation, 200),
    correctFeedback: "Ottimo recupero attivo.",
    estimatedDurationSeconds: 45,
    payload: {
      prompt: blurtingPrompt,
      keyPoints: blurtingKeyPoints,
    } as Prisma.InputJsonValue,
    aiVersion: env.aiPromptVersion,
  });

  if (atom.difficulty >= 3) {
    const feynmanCriteria = atom.learningObjectives.map((objective) =>
      objective === "understand"
        ? "Spiega il concetto con parole semplici"
        : `Dimostra l'obiettivo: ${objective}`
    );

    cards.push({
      atomId,
      type: CardType.Feynman,
      order: order++,
      cognitiveObjective: CognitiveObjective.Comprehension,
      prompt: `Spiega "${atom.title}" in modo semplice.`,
      text: `Feynman: ${atom.title}`,
      explanation: compactPhrase(atom.explanation, 200),
      correctFeedback: "Spiegazione chiara.",
      estimatedDurationSeconds: 60,
      payload: {
        prompt: `Spiega "${atom.title}" come se lo stessi insegnando a un amico.`,
        evaluationCriteria:
          feynmanCriteria.length > 0
            ? feynmanCriteria
            : ["Usa un linguaggio semplice", "Collega il concetto a un esempio"],
      } as Prisma.InputJsonValue,
      aiVersion: env.aiPromptVersion,
    });
  }

  const imageReference = atom.images[0];
  if (
    imageReference?.imageId &&
    shouldCreateImageExplainCard(
      { caption: imageReference.caption },
      imageReference
    )
  ) {
    cards.push(
      buildImageExplainCardCreateInput(atomId, atom, imageReference)
    );
  }

  const atomsById = new Map(allAtoms.map((entry) => [entry.id, entry]));
  const connectionCards = buildConnectionCardsForAtom(
    atomId,
    atom,
    atomsById,
    order
  );
  cards.push(...connectionCards.cards);
  order = connectionCards.nextOrder;

  return cards;
}

export const MVP_FEED_CARD_TYPES = [
  CardType.Explain,
  CardType.Quiz,
  CardType.Blurting,
  CardType.Feynman,
  CardType.TrueFalse,
  CardType.ErrorDetection,
  CardType.ImageExplain,
] as const;

export function getGeneratedCardTypes(
  atom: KnowledgeJson["atoms"][number]
): CardType[] {
  let types: CardType[] = atom.images[0]?.imageId
    ? [...MVP_FEED_CARD_TYPES]
    : MVP_FEED_CARD_TYPES.filter((type) => type !== CardType.ImageExplain);

  if (atom.difficulty < 3) {
    types = types.filter((type) => type !== CardType.Feynman);
  }

  if (atom.prerequisites.length > 0) {
    types = [...types, CardType.Connection];
  }

  return types;
}

/** Persisted card order for an atom (used to validate Learn → Act micro-cycle). */
export function getPersistedCardTypeSequence(
  atom: KnowledgeJson["atoms"][number]
): CardType[] {
  return buildCardsForAtom(atom.id, atom, [atom]).map((card) => card.type as CardType);
}
