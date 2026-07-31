export const REQUEST_ID_HEADER = "x-request-id";

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function getRequestIdFromRequest(request: Request): string | undefined {
  return request.headers.get(REQUEST_ID_HEADER) ?? undefined;
}

export function getRequestIdFromHeaders(
  headers: Headers | { get(name: string): string | null }
): string | undefined {
  return headers.get(REQUEST_ID_HEADER) ?? undefined;
}
