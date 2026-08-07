import { CardType, CognitiveObjective } from "@/domain/enums";
import type { KnowledgeJson } from "@/domain/knowledge";
import type { AtomId } from "@/domain/ids";
import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import {
  asDeclarativeQuizOption,
  collectDistractorCandidates,
  isCompleteQuizSentence,
  selectBalancedDistractors,
  type QuizOptionSource,
} from "./quiz-options";
import { deterministicShuffle } from "./deterministic-shuffle";
import { compactPhrase, normalizeForComparison } from "./text-snippets";

function buildImageExplainQuestion(
  atomTitle: string,
  caption?: string | null
): string {
  const trimmedCaption = caption?.trim();
  if (trimmedCaption) {
    return `Cosa collega l'illustrazione «${trimmedCaption}» a "${atomTitle}"?`;
  }

  return `Cosa collega l'illustrazione a "${atomTitle}"?`;
}

function toQuizOptionSource(
  atomId: AtomId,
  atom: KnowledgeJson["atoms"][number]
): QuizOptionSource {
  return {
    id: atomId,
    title: atom.title,
    summary: atom.summary,
    definitions: atom.definitions,
    examples: atom.examples,
    quizDistractors: atom.quizDistractors,
    misconceptions: atom.misconceptions,
    counterExamples: atom.counterExamples,
    commonMistakes: atom.commonMistakes,
  };
}

export function buildImageConnectionCorrectAnswer(
  atomTitle: string,
  imageReference: NonNullable<KnowledgeJson["atoms"][number]["images"][number]>
): string | null {
  const caption = imageReference.caption?.trim();
  const description = imageReference.description?.trim();

  const captionCandidates = caption
    ? [
        `L'illustrazione «${caption}» aiuta a comprendere ${atomTitle}.`,
        `«${caption}» illustra un aspetto centrale di ${atomTitle}.`,
        `L'illustrazione «${caption}» è collegata allo studio di ${atomTitle}.`,
      ]
    : [];

  for (const candidate of captionCandidates) {
    const option = asDeclarativeQuizOption(compactPhrase(candidate, 180));
    if (option) {
      return option;
    }
  }

  if (
    description &&
    caption &&
    normalizeForComparison(description).includes(
      normalizeForComparison(caption).slice(0, Math.min(12, caption.length))
    )
  ) {
    return asDeclarativeQuizOption(compactPhrase(description, 180));
  }

  if (description) {
    const linkedDescription = asDeclarativeQuizOption(
      compactPhrase(description, 180)
    );
    if (
      linkedDescription &&
      normalizeForComparison(linkedDescription).includes(
        normalizeForComparison(atomTitle)
      )
    ) {
      return linkedDescription;
    }
  }

  return null;
}

export function buildImageExplainQuiz(
  atomId: AtomId,
  atom: KnowledgeJson["atoms"][number],
  imageReference: NonNullable<KnowledgeJson["atoms"][number]["images"][number]>,
  shuffle: <T>(items: T[], seed: string) => T[] = deterministicShuffle
): {
  question: string;
  options: string[];
  correctOptionIndex: number;
} | null {
  const source = toQuizOptionSource(atomId, atom);
  const question = buildImageExplainQuestion(atom.title, imageReference.caption);
  const imageCorrect = buildImageConnectionCorrectAnswer(atom.title, imageReference);

  if (!imageCorrect || !isCompleteQuizSentence(imageCorrect)) {
    return null;
  }

  const correctNorm = normalizeForComparison(imageCorrect);
  const distractors = selectBalancedDistractors(
    collectDistractorCandidates(source).filter(
      (option) => normalizeForComparison(option) !== correctNorm
    ),
    imageCorrect,
    3,
    `Questa affermazione non collega l'illustrazione a ${atom.title}.`
  );
  const options = shuffle(
    [imageCorrect, ...distractors],
    `${atomId}:image-explain`
  );

  return {
    question,
    options,
    correctOptionIndex: options.indexOf(imageCorrect),
  };
}

export function buildImageExplainCardFields(
  atomId: AtomId,
  atom: KnowledgeJson["atoms"][number],
  imageReference: NonNullable<KnowledgeJson["atoms"][number]["images"][number]>
): {
  prompt: string;
  text: string;
  explanation: string;
  correctFeedback: string;
  incorrectFeedback: string;
  estimatedDurationSeconds: number;
  cognitiveObjective: CognitiveObjective;
  payload: Prisma.InputJsonValue;
} | null {
  const quiz = buildImageExplainQuiz(atomId, atom, imageReference);

  if (!quiz) {
    return null;
  }

  return {
    prompt: imageReference.caption ?? `Illustrazione: ${atom.title}`,
    text: imageReference.caption ?? "",
    explanation: atom.explanation,
    correctFeedback: "Hai collegato bene immagine e concetto.",
    incorrectFeedback:
      imageReference.description?.trim() ||
      `Rileggi come l'illustrazione «${imageReference.caption ?? atom.title}» si collega al concetto.`,
    estimatedDurationSeconds: 45,
    cognitiveObjective: CognitiveObjective.Connection,
    payload: {
      imageId: imageReference.imageId,
      mode: "quiz",
      question: quiz.question,
      options: quiz.options,
      correctOptionIndex: quiz.correctOptionIndex,
      revealText: imageReference.description ?? atom.summary,
    } as Prisma.InputJsonValue,
  };
}

export function buildImageExplainCardCreateInput(
  atomId: AtomId,
  atom: KnowledgeJson["atoms"][number],
  imageReference: NonNullable<KnowledgeJson["atoms"][number]["images"][number]>
): Prisma.CardCreateManyInput | null {
  const fields = buildImageExplainCardFields(atomId, atom, imageReference);

  if (!fields) {
    return null;
  }

  return {
    atomId,
    type: CardType.ImageExplain,
    order: 6,
    ...fields,
    aiVersion: env.aiPromptVersion,
  };
}
