import type { SubjectId, UserId } from "@/domain/ids";
import { AuthError, resolveAuthenticatedUserId } from "@/auth";
import {
  DevAuthError,
  resolveDevSubjectId as resolveDevSubjectIdBase,
} from "@/lib/dev-auth";
import { FeedEngineError } from "./errors";

function toFeedEngineError(error: DevAuthError): FeedEngineError {
  return new FeedEngineError(error.message, error.code, error.statusCode);
}

export async function resolveDevUserId(request: Request): Promise<UserId> {
  try {
    return await resolveAuthenticatedUserId(request);
  } catch (error) {
    if (error instanceof AuthError) {
      throw new FeedEngineError(error.message, error.code, error.statusCode);
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
