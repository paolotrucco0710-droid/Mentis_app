import { handleApiRouteError } from "@/lib/api/handle-route-error";

export function handleStorageRouteError(
  error: unknown,
  context: { route: string; request?: Request } = { route: "/api/v1/storage" }
) {
  return handleApiRouteError(error, context);
}
