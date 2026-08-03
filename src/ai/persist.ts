import { CardType, CognitiveObjective } from "@/domain/enums";
import type { KnowledgeJson } from "@/domain/knowledge";
import type { AtomId, KnowledgeSourceId, SubjectId } from "@/domain/ids";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/client";
import { env } from "@/lib/env";
import { shouldCreateImageExplainCard } from "./image-study";
import { buildErrorDetectionContent, buildTrueFalseContent } from "./error-detection-options";
import { buildImageExplainCardCreateInput } from "./image-explain-card-builder";
import { deterministicShuffle } from "./deterministic-shuffle";
import { buildQuizOptions } from "./quiz-options";

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
    buildCardsForAtom(atom.id, atom)
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
  atom: KnowledgeJson["atoms"][number]
): Prisma.CardCreateManyInput[] {
  const cards: Prisma.CardCreateManyInput[] = [
    {
      atomId,
      type: CardType.Explain,
      order: 0,
      cognitiveObjective: CognitiveObjective.Comprehension,
      prompt: null,
      text: atom.summary,
      explanation: atom.explanation,
      correctFeedback: "Ottimo, continua così.",
      estimatedDurationSeconds: 45,
      aiVersion: env.aiPromptVersion,
    },
  ];

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
    order: 1,
    cognitiveObjective: CognitiveObjective.Retrieval,
    prompt: quiz.question,
    text: quiz.question,
    explanation: atom.explanation,
    correctFeedback: "Risposta corretta.",
    incorrectFeedback: atom.summary,
    estimatedDurationSeconds: 30,
    payload: {
      question: quiz.question,
      options: quiz.options,
      correctOptionIndex: quiz.correctOptionIndex,
    } as Prisma.InputJsonValue,
    aiVersion: env.aiPromptVersion,
  });

  const blurtingKeyPoints = [
    ...atom.definitions.slice(0, 2),
    ...atom.examples.slice(0, 2),
    atom.summary,
  ]
    .filter(Boolean)
    .slice(0, 4);

  cards.push({
    atomId,
    type: CardType.Blurting,
    order: 2,
    cognitiveObjective: CognitiveObjective.Retrieval,
    prompt: `Scrivi tutto ciò che ricordi su "${atom.title}".`,
    text: `Blurting su ${atom.title}`,
    explanation: atom.explanation,
    correctFeedback: "Ottimo recupero attivo.",
    estimatedDurationSeconds: 60,
    payload: {
      prompt: `Scrivi tutto ciò che ricordi su "${atom.title}" senza guardare gli appunti.`,
      keyPoints: blurtingKeyPoints,
    } as Prisma.InputJsonValue,
    aiVersion: env.aiPromptVersion,
  });

  const feynmanCriteria = atom.learningObjectives.map((objective) =>
    objective === "understand"
      ? "Spiega il concetto con parole semplici"
      : `Dimostra l'obiettivo: ${objective}`
  );

  cards.push({
    atomId,
    type: CardType.Feynman,
    order: 3,
    cognitiveObjective: CognitiveObjective.Comprehension,
    prompt: `Spiega "${atom.title}" come se lo stessi insegnando.`,
    text: `Metodo Feynman per ${atom.title}`,
    explanation: atom.explanation,
    correctFeedback: "Spiegazione chiara.",
    estimatedDurationSeconds: 90,
    payload: {
      prompt: `Spiega "${atom.title}" come se lo stessi insegnando a un amico.`,
      evaluationCriteria:
        feynmanCriteria.length > 0
          ? feynmanCriteria
          : ["Usa un linguaggio semplice", "Collega il concetto a un esempio"],
    } as Prisma.InputJsonValue,
    aiVersion: env.aiPromptVersion,
  });

  const trueFalse = buildTrueFalseContent({
    title: atom.title,
    summary: atom.summary,
    explanation: atom.explanation,
    misconceptions: atom.misconceptions,
    commonMistakes: atom.commonMistakes,
    definitions: atom.definitions,
    counterExamples: atom.counterExamples,
  });

  cards.push({
    atomId,
    type: CardType.TrueFalse,
    order: 4,
    cognitiveObjective: CognitiveObjective.Connection,
    prompt: "Vero o falso?",
    text: trueFalse.statement,
    explanation: atom.explanation,
    correctFeedback: "Esatto.",
    incorrectFeedback: atom.explanation,
    estimatedDurationSeconds: 20,
    payload: {
      statement: trueFalse.statement,
      correctAnswer: trueFalse.correctAnswer,
    } as Prisma.InputJsonValue,
    aiVersion: env.aiPromptVersion,
  });

  const { flawedText, correction } = buildErrorDetectionContent({
    title: atom.title,
    summary: atom.summary,
    explanation: atom.explanation,
    misconceptions: atom.misconceptions,
    commonMistakes: atom.commonMistakes,
    definitions: atom.definitions,
    counterExamples: atom.counterExamples,
  });

  cards.push({
    atomId,
    type: CardType.ErrorDetection,
    order: 5,
    cognitiveObjective: CognitiveObjective.Connection,
    prompt: "Trova l'errore nel testo.",
    text: flawedText,
    explanation: atom.explanation,
    correctFeedback: "Hai individuato l'errore.",
    incorrectFeedback: correction,
    estimatedDurationSeconds: 45,
    payload: {
      text: flawedText,
      errorIndices: flawedText.length > 0 ? [0] : [],
      correction,
    } as Prisma.InputJsonValue,
    aiVersion: env.aiPromptVersion,
  });

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
  const withImage = atom.images[0]?.imageId
    ? MVP_FEED_CARD_TYPES
    : MVP_FEED_CARD_TYPES.filter((type) => type !== CardType.ImageExplain);

  return [...withImage];
}
