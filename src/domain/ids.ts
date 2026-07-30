/**
 * Branded ID types — permanent, immutable identifiers (Invariant 3).
 */

type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, "UserId">;
export type SubjectId = Brand<string, "SubjectId">;
export type CourseId = Brand<string, "CourseId">;
export type ChapterId = Brand<string, "ChapterId">;
export type KnowledgeSourceId = Brand<string, "KnowledgeSourceId">;
export type AtomId = Brand<string, "AtomId">;
export type CardId = Brand<string, "CardId">;
export type ImageId = Brand<string, "ImageId">;
export type UploadId = Brand<string, "UploadId">;
export type AIJobId = Brand<string, "AIJobId">;
export type StudySessionId = Brand<string, "StudySessionId">;
export type SessionEventId = Brand<string, "SessionEventId">;
export type ReviewId = Brand<string, "ReviewId">;
export type AchievementId = Brand<string, "AchievementId">;
export type NotificationId = Brand<string, "NotificationId">;
export type AtomRelationshipId = Brand<string, "AtomRelationshipId">;
