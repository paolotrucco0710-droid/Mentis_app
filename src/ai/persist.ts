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

  const correctAnswer = atom.definitions[0] ?? atom.summary;
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

  const options = shuffle([correctAnswer, ...distractors.slice(0, 3)]);
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

  if (atom.misconceptions.length > 0) {
    const statement = atom.misconceptions[0];
    cards.push({
      atomId,
      type: CardType.TrueFalse,
      order: 2,
      cognitiveObjective: CognitiveObjective.Connection,
      prompt: "Vero o falso?",
      text: statement,
      explanation: atom.explanation,
      correctFeedback: "Esatto.",
      incorrectFeedback: atom.explanation,
      estimatedDurationSeconds: 20,
      payload: {
        statement,
        correctAnswer: false,
      } as Prisma.InputJsonValue,
      aiVersion: env.aiPromptVersion,
    });
  }

  return cards;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
