import { openSession } from "@/session";
import type { StudySession } from "@/domain/entities";
import type { SubjectId, UserId } from "@/domain/ids";

export interface CreateFeedSessionInput {
  userId: UserId;
  subjectId: SubjectId;
}

export async function createFeedSession(
  input: CreateFeedSessionInput
): Promise<StudySession> {
  return openSession(input.userId, { subjectId: input.subjectId });
}
