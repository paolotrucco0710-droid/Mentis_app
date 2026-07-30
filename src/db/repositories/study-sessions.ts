import type { StudySessionId, SubjectId, UserId } from "@/domain/ids";
import type { StudySession } from "@/domain/entities";
import { getDb, type DbTx } from "../transaction";
import { toStudySession } from "../mappers";

export interface CreateStudySessionInput {
  userId: UserId;
  subjectId?: SubjectId | null;
  device?: string | null;
  appVersion?: string | null;
  initialMotivation?: number | null;
}

export async function findStudySessionById(
  id: StudySessionId
): Promise<StudySession | null> {
  const record = await getDb().studySession.findUnique({ where: { id } });
  return record ? toStudySession(record) : null;
}

export async function findStudySessionsByUserId(
  userId: UserId,
  limit = 20
): Promise<StudySession[]> {
  const records = await getDb().studySession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
  return records.map(toStudySession);
}

export async function createStudySession(
  input: CreateStudySessionInput
): Promise<StudySession> {
  const record = await getDb().studySession.create({ data: input });
  return toStudySession(record);
}

export interface EndStudySessionInput {
  id: StudySessionId;
  endedAt: Date;
  durationMs: number;
  cardsViewed?: number;
  atomsCompleted?: number;
  reviewsCompleted?: number;
  errorCount?: number;
  correctAnswerCount?: number;
  focusScore?: number | null;
  fatigueScore?: number | null;
  finalMotivation?: number | null;
}

export async function endStudySession(
  input: EndStudySessionInput
): Promise<StudySession> {
  const { id, durationMs, ...rest } = input;
  const record = await getDb().studySession.update({
    where: { id },
    data: {
      ...rest,
      durationMs: BigInt(durationMs),
    },
  });
  return toStudySession(record);
}

export async function incrementSessionCardsViewed(
  id: StudySessionId,
  tx?: DbTx
): Promise<StudySession> {
  const record = await getDb(tx).studySession.update({
    where: { id },
    data: { cardsViewed: { increment: 1 } },
  });
  return toStudySession(record);
}

export interface RecordSessionAnswerInput {
  id: StudySessionId;
  wasCorrect: boolean;
  wasReview: boolean;
  atomMastered: boolean;
}

export async function recordSessionAnswer(
  input: RecordSessionAnswerInput,
  tx?: DbTx
): Promise<StudySession> {
  const record = await getDb(tx).studySession.update({
    where: { id: input.id },
    data: {
      cardsViewed: { increment: 1 },
      correctAnswerCount: input.wasCorrect
        ? { increment: 1 }
        : undefined,
      errorCount: input.wasCorrect ? undefined : { increment: 1 },
      reviewsCompleted: input.wasReview && input.wasCorrect
        ? { increment: 1 }
        : undefined,
      atomsCompleted: input.atomMastered ? { increment: 1 } : undefined,
    },
  });
  return toStudySession(record);
}
