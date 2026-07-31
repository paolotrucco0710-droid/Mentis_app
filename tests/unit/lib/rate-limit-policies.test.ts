import { describe, expect, it } from "vitest";
import { resolveRateLimitPolicy } from "@/lib/rate-limit/policies";

describe("lib/rate-limit/policies", () => {
  it("uses strict auth limits for auth endpoints", () => {
    expect(resolveRateLimitPolicy("/api/v1/auth/login")?.name).toBe("auth");
  });

  it("uses upload limits for upload endpoints", () => {
    expect(resolveRateLimitPolicy("/api/v1/upload")?.name).toBe("upload");
  });

  it("uses general api limits for other endpoints", () => {
    expect(resolveRateLimitPolicy("/api/v1/subjects")?.name).toBe("api");
  });

  it("uses health policy for readiness endpoints", () => {
    expect(resolveRateLimitPolicy("/api/ready")?.name).toBe("health");
  });
});
