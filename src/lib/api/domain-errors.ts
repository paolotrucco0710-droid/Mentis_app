import { AnalyticsError } from "@/analytics";
import { AIProcessingError } from "@/ai/pipeline";
import { AuthError } from "@/auth";
import { CourseManagementError } from "@/course/errors";
import { FeedEngineError } from "@/engine/errors";
import { ProfileError } from "@/profile";
import { ProgressEngineError } from "@/progress/errors";
import { ReviewEngineError } from "@/review/errors";
import { SessionEngineError } from "@/session/errors";
import { StorageError } from "@/storage/errors";
import { UploadPipelineError } from "@/upload/pipeline";

export interface DomainHttpError {
  message: string;
  code: string;
  statusCode: number;
}

const DOMAIN_ERROR_TYPES = [
  AuthError,
  AnalyticsError,
  FeedEngineError,
  ProfileError,
  StorageError,
  CourseManagementError,
  UploadPipelineError,
  AIProcessingError,
  ProgressEngineError,
  ReviewEngineError,
  SessionEngineError,
] as const;

export function toDomainHttpError(error: unknown): DomainHttpError | null {
  for (const ErrorType of DOMAIN_ERROR_TYPES) {
    if (error instanceof ErrorType) {
      return {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      };
    }
  }

  return null;
}
