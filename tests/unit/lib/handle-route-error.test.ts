import { describe, expect, it, vi } from "vitest";
import { AuthError } from "@/auth";
import { handleApiRouteError } from "@/lib/api/handle-route-error";

vi.mock("@/analytics/track", () => ({
  trackApiError: vi.fn(),
}));

describe("lib/api/handle-route-error", () => {
  it("returns structured domain error responses", async () => {
    const response = handleApiRouteError(
      new AuthError("Sessione scaduta.", "SESSION_EXPIRED", 401),
      { route: "/api/v1/auth/refresh", requestId: "req-1" }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Sessione scaduta.",
      code: "SESSION_EXPIRED",
      requestId: "req-1",
    });
  });

  it("returns internal error responses for unknown failures", async () => {
    const response = handleApiRouteError(new Error("unexpected"), {
      route: "/api/v1/subjects",
      requestId: "req-2",
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Errore interno.",
      code: "INTERNAL_ERROR",
      requestId: "req-2",
    });
  });
});
