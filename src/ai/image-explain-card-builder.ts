import { CardType, CognitiveObjective } from "@/domain/enums";
import type { KnowledgeJson } from "@/domain/knowledge";
import type { AtomId } from "@/domain/ids";
import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import {
  asDeclarativeQuizOption,
  buildSecondaryQuiz,
  collectDistractorCandidates,
  isCompleteQuizSentence,
  selectBalancedDistractors,
  type QuizOptionSource,
} from "./quiz-options";
import { deterministicShuffle } from "./deterministic-shuffle";
import { normalizeForComparison } from "./text-snippets";

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

export function buildImageExplainQuiz(
  atomId: AtomId,
  atom: KnowledgeJson["atoms"][number],
  imageReference: NonNullable<KnowledgeJson["atoms"][number]["images"][number]>,
  primaryCorrectAnswer: string,
  shuffle: <T>(items: T[], seed: string) => T[] = deterministicShuffle
): {
  question: string;
  options: string[];
  correctOptionIndex: number;
} | null {
  const source = toQuizOptionSource(atomId, atom);
  const question = buildImageExplainQuestion(atom.title, imageReference.caption);
  const secondary = buildSecondaryQuiz(source, shuffle, primaryCorrectAnswer);

  if (secondary) {
    return {
      question,
      options: secondary.options,
      correctOptionIndex: secondary.correctOptionIndex,
    };
  }

  const primaryNorm = normalizeForComparison(primaryCorrectAnswer);
  const imageCorrect =
    asDeclarativeQuizOption(imageReference.description ?? undefined) ??
    asDeclarativeQuizOption(
      imageReference.referencedConcepts?.[0]
        ? `L'illustrazione riguarda ${imageReference.referencedConcepts[0]}.`
        : undefined
    );

  if (
    imageCorrect &&
    normalizeForComparison(imageCorrect) !== primaryNorm
  ) {
    const distractors = selectBalancedDistractors(
      collectDistractorCandidates(source).filter(
        (option) => normalizeForComparison(option) !== primaryNorm
      ),
      imageCorrect,
      3,
      `Questa affermazione non descrive l'illustrazione di ${atom.title}.`
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

  for (const candidate of [
    ...(atom.examples ?? []),
    ...(atom.definitions ?? []),
    atom.summary,
  ]) {
    const alternateCorrect = asDeclarativeQuizOption(candidate);
    if (
      !alternateCorrect ||
      !isCompleteQuizSentence(alternateCorrect) ||
      normalizeForComparison(alternateCorrect) === primaryNorm
    ) {
      continue;
    }

    const distractors = selectBalancedDistractors(
      collectDistractorCandidates(source).filter(
        (option) => normalizeForComparison(option) !== primaryNorm
      ),
      alternateCorrect,
      3,
      `Questa affermazione non descrive l'illustrazione di ${atom.title}.`
    );
    const options = shuffle(
      [alternateCorrect, ...distractors],
      `${atomId}:image-explain`
    );

    return {
      question,
      options,
      correctOptionIndex: options.indexOf(alternateCorrect),
    };
  }

  return null;
}

export function buildImageExplainCardFields(
  atomId: AtomId,
  atom: KnowledgeJson["atoms"][number],
  imageReference: NonNullable<KnowledgeJson["atoms"][number]["images"][number]>,
  primaryCorrectAnswer: string
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
  const quiz = buildImageExplainQuiz(
    atomId,
    atom,
    imageReference,
    primaryCorrectAnswer
  );

  if (!quiz) {
    return null;
  }

  return {
    prompt: imageReference.caption ?? `Illustrazione: ${atom.title}`,
    text: imageReference.caption ?? "",
    explanation: atom.explanation,
    correctFeedback: "Hai collegato bene immagine e concetto.",
    incorrectFeedback: atom.summary,
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
  imageReference: NonNullable<KnowledgeJson["atoms"][number]["images"][number]>,
  primaryCorrectAnswer: string
): Prisma.CardCreateManyInput | null {
  const fields = buildImageExplainCardFields(
    atomId,
    atom,
    imageReference,
    primaryCorrectAnswer
  );

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
