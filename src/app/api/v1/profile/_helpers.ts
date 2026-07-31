import { handleApiRouteError } from "@/lib/api/handle-route-error";

export function handleProfileRouteError(
  error: unknown,
  context: { route: string; request?: Request } = { route: "/api/v1/profile" }
) {
  return handleApiRouteError(error, context);
}
