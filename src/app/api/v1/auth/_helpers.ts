import { handleApiRouteError } from "@/lib/api/handle-route-error";

export function handleAuthRouteError(
  error: unknown,
  context: { route: string; request?: Request } = { route: "/api/v1/auth" }
) {
  return handleApiRouteError(error, context);
}
