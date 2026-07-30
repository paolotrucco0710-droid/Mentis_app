import type { SubjectId, UserId } from "@/domain/ids";
import {
  DevAuthError,
  resolveDevSubjectId as resolveDevSubjectIdBase,
  resolveDevUserId as resolveDevUserIdBase,
} from "@/lib/dev-auth";
import { FeedEngineError } from "./errors";

function toFeedEngineError(error: DevAuthError): FeedEngineError {
  return new FeedEngineError(error.message, error.code, error.statusCode);
}

export function resolveDevUserId(): UserId {
  try {
    return resolveDevUserIdBase();
  } catch (error) {
    if (error instanceof DevAuthError) {
      throw toFeedEngineError(error);
    }
    throw error;
  }
}

export function resolveDevSubjectId(
  requestedSubjectId: string | null
): SubjectId {
  try {
    return resolveDevSubjectIdBase(requestedSubjectId);
  } catch (error) {
    if (error instanceof DevAuthError) {
      throw toFeedEngineError(error);
    }
    throw error;
  }
}
