import {
  countAtomsByKnowledgeSourceId,
  countAtomsBySubjectId,
  findAtomsByKnowledgeSourceId,
  findAtomsBySubjectId,
} from "@/db/repositories/atoms";
import { findChapterById, findChaptersByCourseId } from "@/db/repositories/chapters";
import { findUserAtomStatesByUserId } from "@/db/repositories/user-atom-states";
import type { Progress } from "@/domain/entities/progress";
import { ProgressScopeType } from "@/domain/entities/progress";
import type { UserAtomState } from "@/domain/entities";
import { UserAtomLearningState } from "@/domain/enums";
import type {
  ChapterId,
  CourseId,
  KnowledgeSourceId,
  SubjectId,
  UserId,
} from "@/domain/ids";
import { MASTERY_STABLE_THRESHOLD } from "@/engine/constants";
import { ProgressEngineError } from "./errors";

export interface GetProgressInput {
  userId: UserId;
  scopeType: ProgressScopeType;
  scopeId: string;
}

export async function getProgress(input: GetProgressInput): Promise<Progress> {
  const atomIds = await resolveAtomIds(input.scopeType, input.scopeId);
  const states = await findUserAtomStatesByUserId(input.userId);
  const relevantStates = states.filter((state) => atomIds.has(state.atomId));

  return buildProgress({
    userId: input.userId,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    atomsTotal: atomIds.size,
    states: relevantStates,
  });
}

async function resolveAtomIds(
  scopeType: ProgressScopeType,
  scopeId: string
): Promise<Set<string>> {
  switch (scopeType) {
    case ProgressScopeType.Subject: {
      const atoms = await findAtomsBySubjectId(scopeId as SubjectId);
      return new Set(atoms.map((atom) => atom.id));
    }
    case ProgressScopeType.Chapter: {
      const chapter = await findChapterById(scopeId as ChapterId);
      if (!chapter) {
        throw new ProgressEngineError(
          "Capitolo non trovato.",
          "CHAPTER_NOT_FOUND",
          404
        );
      }

      const atoms = await findAtomsByKnowledgeSourceId(
        chapter.knowledgeSourceId
      );
      return new Set(atoms.map((atom) => atom.id));
    }
    case ProgressScopeType.Course: {
      const chapters = await findChaptersByCourseId(scopeId as CourseId);
      const atomIds = new Set<string>();

      for (const chapter of chapters) {
        const atoms = await findAtomsByKnowledgeSourceId(
          chapter.knowledgeSourceId
        );
        for (const atom of atoms) {
          atomIds.add(atom.id);
        }
      }

      return atomIds;
    }
    default:
      throw new ProgressEngineError(
        "Scope non supportato.",
        "INVALID_SCOPE",
        400
      );
  }
}

function buildProgress(input: {
  userId: UserId;
  scopeType: ProgressScopeType;
  scopeId: string;
  atomsTotal: number;
  states: UserAtomState[];
}): Progress {
  const { userId, scopeType, scopeId, atomsTotal, states } = input;

  const atomsMastered = states.filter(
    (state) =>
      state.mastery >= MASTERY_STABLE_THRESHOLD ||
      state.currentStage === UserAtomLearningState.Mastered
  ).length;

  const masteryPercent =
    states.length > 0
      ? Math.round(
          states.reduce((sum, state) => sum + state.mastery, 0) / states.length
        )
      : 0;

  const completionPercent =
    atomsTotal > 0 ? Math.round((atomsMastered / atomsTotal) * 100) : 0;

  const lastStudiedAt = states.reduce<Date | null>((latest, state) => {
    if (!state.lastViewedAt) {
      return latest;
    }
    if (!latest || state.lastViewedAt > latest) {
      return state.lastViewedAt;
    }
    return latest;
  }, null);

  const memoryHealth =
    states.length > 0
      ? Math.round(
          states.reduce(
            (sum, state) => sum + (1 - state.estimatedDecay) * 100,
            0
          ) / states.length
        )
      : null;

  return {
    userId,
    scopeType,
    scopeId,
    masteryPercent: masteryPercent as Progress["masteryPercent"],
    atomsTotal,
    atomsMastered,
    atomsRemaining: Math.max(atomsTotal - atomsMastered, 0),
    completionPercent: completionPercent as Progress["completionPercent"],
    lastStudiedAt,
    memoryHealth: memoryHealth as Progress["memoryHealth"],
  };
}

export async function countAtomsForScope(
  scopeType: ProgressScopeType,
  scopeId: string
): Promise<number> {
  switch (scopeType) {
    case ProgressScopeType.Subject:
      return countAtomsBySubjectId(scopeId as SubjectId);
    case ProgressScopeType.Chapter: {
      const chapter = await findChapterById(scopeId as ChapterId);
      if (!chapter) {
        return 0;
      }
      return countAtomsByKnowledgeSourceId(
        chapter.knowledgeSourceId as KnowledgeSourceId
      );
    }
    case ProgressScopeType.Course: {
      const chapters = await findChaptersByCourseId(scopeId as CourseId);
      let total = 0;
      for (const chapter of chapters) {
        total += await countAtomsByKnowledgeSourceId(chapter.knowledgeSourceId);
      }
      return total;
    }
    default:
      return 0;
  }
}
