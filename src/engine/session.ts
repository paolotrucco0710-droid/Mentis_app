import { createStudySession } from "@/db/repositories/study-sessions";
import { findSubjectById } from "@/db/repositories/subjects";
import type { StudySession } from "@/domain/entities";
import type { SubjectId, UserId } from "@/domain/ids";
import { FeedEngineError } from "./errors";

export interface CreateFeedSessionInput {
  userId: UserId;
  subjectId: SubjectId;
}

export async function createFeedSession(
  input: CreateFeedSessionInput
): Promise<StudySession> {
  const subject = await findSubjectById(input.subjectId);
  if (!subject) {
    throw new FeedEngineError(
      "Materia non trovata.",
      "SUBJECT_NOT_FOUND",
      404
    );
  }

  if (subject.userId !== input.userId) {
    throw new FeedEngineError(
      "Non hai accesso a questa materia.",
      "SUBJECT_FORBIDDEN",
      403
    );
  }

  return createStudySession({
    userId: input.userId,
    subjectId: input.subjectId,
  });
}
