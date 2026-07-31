import type { SubjectId, UserId } from "@/domain/ids";
import { AuthError, resolveAuthenticatedUserId } from "@/auth";
import { assertSubjectOwned } from "@/course/helpers";
import { env } from "@/lib/env";
import { FeedEngineError } from "./errors";

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

export async function resolveRequestedSubjectId(
  userId: UserId,
  requestedSubjectId: string | null
): Promise<SubjectId> {
  if (requestedSubjectId) {
    await assertSubjectOwned(userId, requestedSubjectId as SubjectId);
    return requestedSubjectId as SubjectId;
  }

  if (env.authDevFallback && env.devSubjectId) {
    await assertSubjectOwned(userId, env.devSubjectId as SubjectId);
    return env.devSubjectId as SubjectId;
  }

  throw new FeedEngineError(
    "subjectId è obbligatorio.",
    "SUBJECT_REQUIRED",
    400
  );
}
