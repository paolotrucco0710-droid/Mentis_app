import { handleApiRouteError } from "@/lib/api/handle-route-error";

export function handleAnalyticsRouteError(
  error: unknown,
  context: { route: string; request?: Request } = { route: "/api/v1/analytics" }
) {
  return handleApiRouteError(error, context);
}
