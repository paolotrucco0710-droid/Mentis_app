import { NextResponse } from "next/server";
import { trackApiError } from "@/analytics/track";
import type { UserId } from "@/domain/ids";
import { logger } from "@/lib/logger";
import { toDomainHttpError } from "./domain-errors";
import { getRequestIdFromRequest } from "./request-context";

export interface ApiRouteErrorContext {
  route: string;
  userId?: UserId | null;
  request?: Request;
  requestId?: string;
}

export function handleApiRouteError(
  error: unknown,
  context: ApiRouteErrorContext
): NextResponse {
  const requestId =
    context.requestId ??
    (context.request ? getRequestIdFromRequest(context.request) : undefined);

  const domainError = toDomainHttpError(error);

  if (domainError) {
    trackApiError({
      userId: context.userId,
      code: domainError.code,
      message: domainError.message,
      route: context.route,
      status: domainError.statusCode,
    });

    return NextResponse.json(
      {
        error: domainError.message,
        code: domainError.code,
        requestId,
      },
      {
        status: domainError.statusCode,
        headers: requestId ? { "x-request-id": requestId } : undefined,
      }
    );
  }

  logger.error("Unhandled API route error", error, {
    route: context.route,
    requestId,
    userId: context.userId ?? undefined,
    code: "INTERNAL_ERROR",
    status: 500,
  });

  trackApiError({
    userId: context.userId,
    code: "INTERNAL_ERROR",
    message: "Errore interno.",
    route: context.route,
    status: 500,
  });

  return NextResponse.json(
    {
      error: "Errore interno.",
      code: "INTERNAL_ERROR",
      requestId,
    },
    {
      status: 500,
      headers: requestId ? { "x-request-id": requestId } : undefined,
    }
  );
}
