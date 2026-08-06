import type {
  AIJobId,
  AtomId,
  CardId,
  ChapterId,
  CourseId,
  ImageId,
  KnowledgeSourceId,
  NotificationId,
  ReviewId,
  SessionEventId,
  StudySessionId,
  SubjectId,
  UploadId,
  UserId,
} from "@/domain/ids";
import type { UserPreferences } from "@/domain/entities/user";
import type { AtomImageReference } from "@/domain/entities/atom";
import type { CardPayload } from "@/domain/entities/card";
import type { LearningObjective } from "@/domain/enums";

export function asUserId(id: string): UserId {
  return id as UserId;
}

export function asSubjectId(id: string): SubjectId {
  return id as SubjectId;
}

export function asCourseId(id: string): CourseId {
  return id as CourseId;
}

export function asChapterId(id: string): ChapterId {
  return id as ChapterId;
}

export function asKnowledgeSourceId(id: string): KnowledgeSourceId {
  return id as KnowledgeSourceId;
}

export function asAtomId(id: string): AtomId {
  return id as AtomId;
}

export function asCardId(id: string): CardId {
  return id as CardId;
}

export function asImageId(id: string): ImageId {
  return id as ImageId;
}

export function asUploadId(id: string): UploadId {
  return id as UploadId;
}

export function asAIJobId(id: string): AIJobId {
  return id as AIJobId;
}

export function asStudySessionId(id: string): StudySessionId {
  return id as StudySessionId;
}

export function asSessionEventId(id: string): SessionEventId {
  return id as SessionEventId;
}

export function asReviewId(id: string): ReviewId {
  return id as ReviewId;
}

export function asNotificationId(id: string): NotificationId {
  return id as NotificationId;
}

export function toNumber(value: bigint | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "bigint" ? Number(value) : value;
}

export function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

export function parseLearningObjectives(value: unknown): LearningObjective[] {
  return Array.isArray(value) ? (value as LearningObjective[]) : [];
}

export function parsePreferences(value: unknown): UserPreferences {
  const defaults: UserPreferences = {
    language: "it",
    timezone: "Europe/Rome",
    notificationsEnabled: true,
    dailyGoalMinutes: null,
    onboardingCompletedAt: null,
  };
  if (!value || typeof value !== "object") return defaults;
  return { ...defaults, ...(value as UserPreferences) };
}

export function parseAtomImages(value: unknown): AtomImageReference[] {
  return Array.isArray(value) ? (value as AtomImageReference[]) : [];
}

export function parseCardPayload(value: unknown): CardPayload | null {
  if (!value || typeof value !== "object") return null;
  return value as CardPayload;
}

export function parseImageIds(value: unknown): ImageId[] {
  return Array.isArray(value) ? (value as ImageId[]) : [];
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
