import { CardType, CognitiveObjective } from "@/domain/enums";
import type { KnowledgeJson } from "@/domain/knowledge";
import type { AtomId } from "@/domain/ids";
import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { deterministicShuffle } from "./deterministic-shuffle";
import { compactPhrase } from "./text-snippets";

export function buildConnectionQuestion(
  atomTitle: string,
  prerequisiteTitle: string
): string {
  return `Come si lega «${atomTitle}» a «${prerequisiteTitle}»?`;
}

export function buildConnectionOptions(
  atom: KnowledgeJson["atoms"][number],
  prerequisite: KnowledgeJson["atoms"][number]
): { options: string[]; correctOptionIndex: number } | null {
  const correctStatement = compactPhrase(
    `${prerequisite.title} prepara le basi per capire ${atom.title}.`,
    140
  );

  const distractors = [
    compactPhrase(
      `${atom.title} è prerequisito di ${prerequisite.title}.`,
      140
    ),
    compactPhrase(
      `${prerequisite.title} è solo un esempio applicato di ${atom.title}.`,
      140
    ),
    compactPhrase("I due concetti non hanno un legame diretto.", 140),
  ];

  const options = deterministicShuffle(
    [correctStatement, ...distractors],
    `${atom.id}:${prerequisite.id}`
  );
  const correctOptionIndex = options.indexOf(correctStatement);

  if (correctOptionIndex < 0) {
    return null;
  }

  return { options, correctOptionIndex };
}

export function buildConnectionCardCreateInput(
  atomId: AtomId,
  atom: KnowledgeJson["atoms"][number],
  prerequisite: KnowledgeJson["atoms"][number],
  order: number
): Prisma.CardCreateManyInput | null {
  const quiz = buildConnectionOptions(atom, prerequisite);
  if (!quiz) {
    return null;
  }

  const question = buildConnectionQuestion(atom.title, prerequisite.title);

  return {
    atomId,
    type: CardType.Connection,
    order,
    cognitiveObjective: CognitiveObjective.Connection,
    prompt: question,
    text: question,
    explanation: compactPhrase(atom.explanation, 200),
    correctFeedback: "Hai colto il legame tra i concetti.",
    incorrectFeedback: compactPhrase(prerequisite.summary, 120),
    estimatedDurationSeconds: 25,
    payload: {
      relatedAtomId: prerequisite.id,
      relatedAtomTitle: prerequisite.title,
      relationType: "prerequisite",
      question,
      options: quiz.options,
      correctOptionIndex: quiz.correctOptionIndex,
    } as unknown as Prisma.InputJsonValue,
    aiVersion: env.aiPromptVersion,
  };
}

export function buildConnectionCardsForAtom(
  atomId: AtomId,
  atom: KnowledgeJson["atoms"][number],
  atomsById: Map<AtomId, KnowledgeJson["atoms"][number]>,
  order: number
): { cards: Prisma.CardCreateManyInput[]; nextOrder: number } {
  const cards: Prisma.CardCreateManyInput[] = [];
  let nextOrder = order;

  for (const prerequisiteId of atom.prerequisites) {
    const prerequisite = atomsById.get(prerequisiteId);
    if (!prerequisite) {
      continue;
    }

    const connection = buildConnectionCardCreateInput(
      atomId,
      atom,
      prerequisite,
      nextOrder
    );

    if (connection) {
      cards.push(connection);
      nextOrder += 1;
      break;
    }
  }

  return { cards, nextOrder };
}
