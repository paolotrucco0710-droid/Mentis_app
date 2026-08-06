import { CardType, CognitiveObjective } from "@/domain/enums";
import type { KnowledgeJson } from "@/domain/knowledge";
import type { AtomId } from "@/domain/ids";
import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import {
  buildImageLabelingTask,
  buildImageLabelPrompt,
} from "./image-label-regions";
import { buildQuizOptions } from "./quiz-options";
import { deterministicShuffle } from "./deterministic-shuffle";

function buildImageQuestion(atomTitle: string): string {
  return `Quale affermazione su "${atomTitle}" è corretta?`;
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
} {
  const labeling = buildImageLabelingTask(atomId, atom, imageReference);

  if (labeling) {
    return {
      prompt: imageReference.caption ?? `Illustrazione: ${atom.title}`,
      text: imageReference.caption ?? "",
      explanation: atom.explanation,
      correctFeedback: "Hai individuato la zona giusta.",
      incorrectFeedback: imageReference.description ?? atom.summary,
      estimatedDurationSeconds: 50,
      cognitiveObjective: CognitiveObjective.Connection,
      payload: {
        imageId: imageReference.imageId,
        mode: labeling.mode,
        regions: labeling.regions,
        correctRegionId: labeling.correctRegionId,
        targetLabel: labeling.targetLabel,
        question: buildImageLabelPrompt(labeling.targetLabel),
        revealText: imageReference.description ?? atom.summary,
      } as unknown as Prisma.InputJsonValue,
    };
  }

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
      question: buildImageQuestion(atom.title),
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
): Prisma.CardCreateManyInput {
  const fields = buildImageExplainCardFields(atomId, atom, imageReference);

  return {
    atomId,
    type: CardType.ImageExplain,
    order: 6,
    ...fields,
    aiVersion: env.aiPromptVersion,
  };
}
