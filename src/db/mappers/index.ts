import type {
  User,
  Atom,
  Card,
  Subject,
  Course,
  Chapter,
  KnowledgeSource,
  Image,
  Upload,
  AIJob,
  UserAtomState,
  UserCardState,
  StudySession,
  SessionEvent,
  Review,
  DailyStatistics,
  Notification,
} from "@/domain/entities";
import type { User as PrismaUser, Atom as PrismaAtom } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import {
  asAIJobId,
  asAtomId,
  asCardId,
  asChapterId,
  asCourseId,
  asImageId,
  asKnowledgeSourceId,
  asNotificationId,
  asReviewId,
  asSessionEventId,
  asStudySessionId,
  asSubjectId,
  asUploadId,
  asUserId,
  formatDateOnly,
  parseAtomImages,
  parseCardPayload,
  parseImageIds,
  parseLearningObjectives,
  parsePreferences,
  parseStringArray,
  toNumber,
} from "./helpers";

type AtomWithPrerequisites = PrismaAtom & {
  prerequisites?: { prerequisiteAtomId: string }[];
};

export function toUser(record: PrismaUser): User {
  return {
    id: asUserId(record.id),
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    passwordHash: record.passwordHash,
    registeredAt: record.registeredAt,
    lastAccessAt: record.lastAccessAt,
    language: record.language,
    timezone: record.timezone,
    schoolGrade: record.schoolGrade,
    schoolYear: record.schoolYear,
    personalGoals: parseStringArray(record.personalGoals),
    preferences: parsePreferences(record.preferences),
    profileImageUrl: record.profileImageUrl,
    premiumPlan: record.premiumPlan as User["premiumPlan"],
    accountStatus: record.accountStatus as User["accountStatus"],
    deletedAt: record.deletedAt,
  };
}

export function toSubject(record: Prisma.SubjectGetPayload<object>): Subject {
  return {
    id: asSubjectId(record.id),
    userId: asUserId(record.userId),
    name: record.name,
    color: record.color,
    icon: record.icon,
    displayOrder: record.displayOrder,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  };
}

export function toCourse(record: Prisma.CourseGetPayload<object>): Course {
  return {
    id: asCourseId(record.id),
    userId: asUserId(record.userId),
    subjectId: asSubjectId(record.subjectId),
    title: record.title,
    description: record.description,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  };
}

export function toChapter(record: Prisma.ChapterGetPayload<object>): Chapter {
  return {
    id: asChapterId(record.id),
    courseId: asCourseId(record.courseId),
    subjectId: asSubjectId(record.subjectId),
    knowledgeSourceId: asKnowledgeSourceId(record.knowledgeSourceId),
    title: record.title,
    chapterNumber: record.chapterNumber,
    displayOrder: record.displayOrder,
    estimatedStudyTimeMinutes: record.estimatedStudyTimeMinutes,
    difficultyLevel: record.difficultyLevel as Chapter["difficultyLevel"],
    atomCount: record.atomCount,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  };
}

export function toKnowledgeSource(
  record: Prisma.KnowledgeSourceGetPayload<object>
): KnowledgeSource {
  return {
    id: asKnowledgeSourceId(record.id),
    userId: asUserId(record.userId),
    subjectId: asSubjectId(record.subjectId),
    title: record.title,
    sourceType: record.sourceType as KnowledgeSource["sourceType"],
    pageCount: record.pageCount,
    language: record.language,
    uploadedAt: record.uploadedAt,
    processedAt: record.processedAt,
    parserVersion: record.parserVersion,
    promptVersion: record.promptVersion,
    processingStatus:
      record.processingStatus as KnowledgeSource["processingStatus"],
    fileSizeBytes: toNumber(record.fileSizeBytes),
    fileHash: record.fileHash,
    deletedAt: record.deletedAt,
  };
}

export function toImage(record: Prisma.ImageGetPayload<object>): Image {
  const bbox = record.bboxNormalized;

  return {
    id: asImageId(record.id),
    knowledgeSourceId: asKnowledgeSourceId(record.knowledgeSourceId),
    ownerId: asUserId(record.ownerId),
    storageKey: record.storageKey,
    masterStorageKey: record.masterStorageKey,
    hash: record.hash,
    mimeType: record.mimeType,
    sizeBytes: toNumber(record.sizeBytes),
    width: record.width,
    height: record.height,
    pageNumber: record.pageNumber,
    caption: record.caption,
    sourcePageImageId: record.sourcePageImageId
      ? asImageId(record.sourcePageImageId)
      : null,
    bboxNormalized:
      bbox &&
      typeof bbox === "object" &&
      bbox !== null &&
      "top" in bbox &&
      "left" in bbox &&
      "bottom" in bbox &&
      "right" in bbox
        ? (bbox as Image["bboxNormalized"])
        : null,
    detectionConfidence: record.detectionConfidence,
    pipelineVersion: record.pipelineVersion,
    fallbackToFullPage: record.fallbackToFullPage,
    regionType: record.regionType,
    containsText: record.containsText,
    createdAt: record.createdAt,
    deletedAt: record.deletedAt,
  };
}

export function toUpload(record: Prisma.UploadGetPayload<object>): Upload {
  return {
    id: asUploadId(record.id),
    userId: asUserId(record.userId),
    subjectId: record.subjectId ? asSubjectId(record.subjectId) : null,
    courseId: record.courseId ? asCourseId(record.courseId) : null,
    knowledgeSourceId: record.knowledgeSourceId
      ? asKnowledgeSourceId(record.knowledgeSourceId)
      : null,
    status: record.status as Upload["status"],
    imageIds: parseImageIds(record.imageIds),
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    errorMessage: record.errorMessage,
  };
}

export function toAIJob(record: Prisma.AIJobGetPayload<object>): AIJob {
  return {
    id: asAIJobId(record.id),
    knowledgeSourceId: asKnowledgeSourceId(record.knowledgeSourceId),
    userId: asUserId(record.userId),
    status: record.status as AIJob["status"],
    currentStep: record.currentStep as AIJob["currentStep"],
    attemptCount: record.attemptCount,
    maxAttempts: record.maxAttempts,
    promptVersion: record.promptVersion,
    parserVersion: record.parserVersion,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    estimatedCostUsd: Number(record.estimatedCostUsd),
    cacheHits: record.cacheHits,
    cacheMisses: record.cacheMisses,
    errorMessage: record.errorMessage,
    queuedAt: record.queuedAt,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
  };
}

export function toAtom(record: AtomWithPrerequisites): Atom {
  const prerequisites =
    record.prerequisites?.map((p) => asAtomId(p.prerequisiteAtomId)) ?? [];

  return {
    id: asAtomId(record.id),
    knowledgeSourceId: asKnowledgeSourceId(record.knowledgeSourceId),
    subjectId: asSubjectId(record.subjectId),
    title: record.title,
    summary: record.summary,
    explanation: record.explanation,
    importance: record.importance as Atom["importance"],
    difficulty: record.difficulty as Atom["difficulty"],
    abstractionLevel: record.abstractionLevel as Atom["abstractionLevel"],
    logicalOrder: record.logicalOrder,
    originalOrder: record.originalOrder,
    prerequisites,
    learningObjectives: parseLearningObjectives(record.learningObjectives),
    keywords: parseStringArray(record.keywords),
    aliases: parseStringArray(record.aliases),
    formulas: parseStringArray(record.formulas),
    definitions: parseStringArray(record.definitions),
    examples: parseStringArray(record.examples),
    counterExamples: parseStringArray(record.counterExamples),
    commonMistakes: parseStringArray(record.commonMistakes),
    misconceptions: parseStringArray(record.misconceptions),
    applications: parseStringArray(record.applications),
    historicalContext: record.historicalContext,
    notes: record.notes,
    images: parseAtomImages(record.images),
    tables: parseStringArray(record.tables),
    diagrams: parseStringArray(record.diagrams),
    equations: parseStringArray(record.equations),
    citations: parseStringArray(record.citations),
    pageReferences: Array.isArray(record.pageReferences)
      ? (record.pageReferences as number[])
      : [],
    confidence: record.confidence,
    aiVersion: record.aiVersion,
    tokensUsed: record.tokensUsed,
    estimatedStudySeconds: record.estimatedStudySeconds,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function toCard(record: Prisma.CardGetPayload<object>): Card {
  return {
    id: asCardId(record.id),
    atomId: asAtomId(record.atomId),
    type: record.type as Card["type"],
    order: record.order,
    cognitiveObjective: record.cognitiveObjective as Card["cognitiveObjective"],
    prompt: record.prompt,
    text: record.text,
    explanation: record.explanation,
    correctFeedback: record.correctFeedback,
    incorrectFeedback: record.incorrectFeedback,
    estimatedDurationSeconds: record.estimatedDurationSeconds,
    payload: parseCardPayload(record.payload),
    aiVersion: record.aiVersion,
    createdAt: record.createdAt,
  };
}

export function toUserAtomState(
  record: Prisma.UserAtomStateGetPayload<object>
): UserAtomState {
  return {
    userId: asUserId(record.userId),
    atomId: asAtomId(record.atomId),
    mastery: record.mastery,
    confidence: record.confidence,
    currentStage: record.currentStage as UserAtomState["currentStage"],
    exposureCount: record.exposureCount,
    errorCount: record.errorCount,
    correctAnswerCount: record.correctAnswerCount,
    wrongAnswerCount: record.wrongAnswerCount,
    lastViewedAt: record.lastViewedAt,
    nextReviewAt: record.nextReviewAt,
    averageResponseTimeMs: record.averageResponseTimeMs,
    totalStudyTimeMs: toNumber(record.totalStudyTimeMs),
    streak: record.streak,
    estimatedDecay: record.estimatedDecay,
    comprehensionLevel: record.comprehensionLevel,
    lastAlgorithmUsed: record.lastAlgorithmUsed,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function toUserCardState(
  record: Prisma.UserCardStateGetPayload<object>
): UserCardState {
  return {
    userId: asUserId(record.userId),
    cardId: asCardId(record.cardId),
    viewCount: record.viewCount,
    correctAnswerCount: record.correctAnswerCount,
    wrongAnswerCount: record.wrongAnswerCount,
    averageResponseTimeMs: record.averageResponseTimeMs,
    lastAnsweredAt: record.lastAnsweredAt,
    confidence: record.confidence,
    perceivedDifficulty: record.perceivedDifficulty,
    skipped: record.skipped,
    liked: record.liked,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function toStudySession(
  record: Prisma.StudySessionGetPayload<object>
): StudySession {
  return {
    id: asStudySessionId(record.id),
    userId: asUserId(record.userId),
    subjectId: record.subjectId ? asSubjectId(record.subjectId) : null,
    startedAt: record.startedAt,
    endedAt: record.endedAt,
    durationMs: record.durationMs ? toNumber(record.durationMs) : null,
    cardsViewed: record.cardsViewed,
    atomsCompleted: record.atomsCompleted,
    reviewsCompleted: record.reviewsCompleted,
    errorCount: record.errorCount,
    correctAnswerCount: record.correctAnswerCount,
    focusScore: record.focusScore,
    fatigueScore: record.fatigueScore,
    initialMotivation: record.initialMotivation,
    finalMotivation: record.finalMotivation,
    device: record.device,
    appVersion: record.appVersion,
  };
}

export function toSessionEvent(
  record: Prisma.SessionEventGetPayload<object>
): SessionEvent {
  return {
    id: asSessionEventId(record.id),
    sessionId: asStudySessionId(record.sessionId),
    timestamp: record.timestamp,
    type: record.type as SessionEvent["type"],
    atomId: record.atomId ? asAtomId(record.atomId) : null,
    cardId: record.cardId ? asCardId(record.cardId) : null,
    durationMs: record.durationMs,
    outcome: record.outcome as SessionEvent["outcome"],
    declaredConfidence: record.declaredConfidence,
    responseTimeMs: record.responseTimeMs,
    feedPosition: record.feedPosition,
    swipeCount: record.swipeCount,
  };
}

export function toReview(record: Prisma.ReviewGetPayload<object>): Review {
  return {
    id: asReviewId(record.id),
    userId: asUserId(record.userId),
    atomId: asAtomId(record.atomId),
    scheduledAt: record.scheduledAt,
    completedAt: record.completedAt,
    outcome: record.outcome as Review["outcome"],
    algorithm: record.algorithm,
    priority: record.priority,
    status: record.status as Review["status"],
  };
}

export function toDailyStatistics(
  record: Prisma.DailyStatisticsGetPayload<object>
): DailyStatistics {
  return {
    userId: asUserId(record.userId),
    date: formatDateOnly(record.date),
    studyTimeMs: toNumber(record.studyTimeMs),
    cardsCompleted: record.cardsCompleted,
    atomsCompleted: record.atomsCompleted,
    reviewsCompleted: record.reviewsCompleted,
    accuracy: record.accuracy,
    averageFocus: record.averageFocus,
    averageMastery: record.averageMastery,
    dailyStreak: record.dailyStreak,
    activityLevel: record.activityLevel,
  };
}

export function toNotification(
  record: Prisma.NotificationGetPayload<object>
): Notification {
  return {
    id: asNotificationId(record.id),
    userId: asUserId(record.userId),
    type: record.type as Notification["type"],
    title: record.title,
    message: record.message,
    sentAt: record.sentAt,
    openedAt: record.openedAt,
    status: record.status as Notification["status"],
    priority: record.priority as Notification["priority"],
  };
}
