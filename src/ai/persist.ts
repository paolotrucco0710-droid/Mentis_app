import { CardType, CognitiveObjective } from "@/domain/enums";
import type { KnowledgeJson } from "@/domain/knowledge";
import type { AtomId, KnowledgeSourceId, SubjectId } from "@/domain/ids";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/client";
import { env } from "@/lib/env";

export interface PersistResult {
  atomCount: number;
  cardCount: number;
}

export async function persistKnowledgeGraph(input: {
  knowledge: KnowledgeJson;
  knowledgeSourceId: KnowledgeSourceId;
  subjectId: SubjectId;
}): Promise<PersistResult> {
  const { knowledge, knowledgeSourceId, subjectId } = input;

  return prisma.$transaction(async (tx) => {
    await tx.card.deleteMany({
      where: { atom: { knowledgeSourceId } },
    });
    await tx.atomPrerequisite.deleteMany({
      where: { atom: { knowledgeSourceId } },
    });
    await tx.atom.deleteMany({ where: { knowledgeSourceId } });

    let cardCount = 0;

    for (let index = 0; index < knowledge.atoms.length; index++) {
      const atom = knowledge.atoms[index];

      await tx.atom.create({
        data: {
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
        },
      });

      if (atom.prerequisites.length > 0) {
        await tx.atomPrerequisite.createMany({
          data: atom.prerequisites.map((prerequisiteAtomId) => ({
            atomId: atom.id,
            prerequisiteAtomId,
          })),
        });
      }

      const cards = buildCardsForAtom(atom.id, atom);
      if (cards.length > 0) {
        await tx.card.createMany({ data: cards });
        cardCount += cards.length;
      }
    }

    return { atomCount: knowledge.atoms.length, cardCount };
  });
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

  const correctAnswer =
    atom.definitions[0] ?? atom.examples[0] ?? atom.summary;
  const distractors = [
    atom.counterExamples[0],
    atom.commonMistakes[0],
    atom.misconceptions[0],
  ].filter((value): value is string =>
    Boolean(value && value !== correctAnswer)
  );

  while (distractors.length < 3) {
    distractors.push(`Affermazione non corretta su ${atom.title}`);
  }

  const options = deterministicShuffle(
    [correctAnswer, ...distractors.slice(0, 3)],
    atomId
  );
  const correctIndex = options.indexOf(correctAnswer);

  cards.push({
    atomId,
    type: CardType.Quiz,
    order: 1,
    cognitiveObjective: CognitiveObjective.Retrieval,
    prompt: `Cosa descrive meglio "${atom.title}"?`,
    text: `Cosa descrive meglio "${atom.title}"?`,
    explanation: atom.explanation,
    correctFeedback: "Risposta corretta.",
    incorrectFeedback: atom.explanation,
    estimatedDurationSeconds: 30,
    payload: {
      question: `Cosa descrive meglio "${atom.title}"?`,
      options,
      correctOptionIndex: correctIndex,
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

  const trueFalseStatement =
    atom.misconceptions[0] ??
    atom.definitions[0] ??
    `${atom.title}: ${atom.summary}`;
  const trueFalseAnswer = atom.misconceptions.length === 0;

  cards.push({
    atomId,
    type: CardType.TrueFalse,
    order: 4,
    cognitiveObjective: CognitiveObjective.Connection,
    prompt: "Vero o falso?",
    text: trueFalseStatement,
    explanation: atom.explanation,
    correctFeedback: "Esatto.",
    incorrectFeedback: atom.explanation,
    estimatedDurationSeconds: 20,
    payload: {
      statement: trueFalseStatement,
      correctAnswer: trueFalseAnswer,
    } as Prisma.InputJsonValue,
    aiVersion: env.aiPromptVersion,
  });

  const flawedText =
    atom.commonMistakes[0] ??
    `${atom.title} si definisce come: ${atom.counterExamples[0] ?? "concetto non correlato"}.`;
  const correction = atom.definitions[0] ?? atom.explanation;

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
  if (imageReference?.imageId) {
    cards.push({
      atomId,
      type: CardType.ImageExplain,
      order: 6,
      cognitiveObjective: CognitiveObjective.Comprehension,
      prompt: imageReference.caption ?? `Concetto visivo: ${atom.title}`,
      text: imageReference.description ?? atom.summary,
      explanation: atom.explanation,
      correctFeedback: "Ottima osservazione.",
      estimatedDurationSeconds: 40,
      payload: {
        imageId: imageReference.imageId,
      } as Prisma.InputJsonValue,
      aiVersion: env.aiPromptVersion,
    });
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

export function deterministicShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  for (let index = copy.length - 1; index > 0; index -= 1) {
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    const swapIndex = (hash >>> 0) % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}
