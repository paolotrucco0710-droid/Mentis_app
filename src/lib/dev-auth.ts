import type { SubjectId, UserId } from "@/domain/ids";
import { env } from "@/lib/env";

export class DevAuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "DevAuthError";
  }
}

export function resolveDevUserId(): UserId {
  if (!env.devUserId) {
    throw new DevAuthError(
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
    throw new DevAuthError(
      "DEV_SUBJECT_ID non configurato. Aggiungilo nelle variabili ambiente.",
      "DEV_SUBJECT_NOT_CONFIGURED",
      500
    );
  }

  return subjectId as SubjectId;
}
