import type { SubjectId, UserId } from "@/domain/ids";
import { env } from "@/lib/env";
import { FeedEngineError } from "./errors";

export function resolveDevUserId(): UserId {
  if (!env.devUserId) {
    throw new FeedEngineError(
      "DEV_USER_ID non configurato. Aggiungilo nelle variabili ambiente.",
      "DEV_USER_NOT_CONFIGURED",
      500
    );
  }

  return env.devUserId as UserId;
}

export function resolveDevSubjectId(
  requestedSubjectId: string | null
): SubjectId {
  const subjectId = requestedSubjectId ?? env.devSubjectId;

  if (!subjectId) {
    throw new FeedEngineError(
      "DEV_SUBJECT_ID non configurato. Aggiungilo nelle variabili ambiente.",
      "DEV_SUBJECT_NOT_CONFIGURED",
      500
    );
  }

  return subjectId as SubjectId;
}
