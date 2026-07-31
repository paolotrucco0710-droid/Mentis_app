import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserId } from "@/domain/ids";
import { FeedEngineError } from "@/engine/errors";

const assertSubjectOwned = vi.fn();

vi.mock("@/course/helpers", () => ({
  assertSubjectOwned: (...args: unknown[]) => assertSubjectOwned(...args),
}));

const envState = {
  authDevFallback: true,
  devSubjectId: "00000000-0000-4000-8000-000000000002",
};

vi.mock("@/lib/env", () => ({
  env: envState,
}));

describe("resolveRequestedSubjectId", () => {
  beforeEach(() => {
    assertSubjectOwned.mockReset();
    assertSubjectOwned.mockResolvedValue({ id: "subject" });
    envState.authDevFallback = true;
    envState.devSubjectId = "00000000-0000-4000-8000-000000000002";
  });

  it("validates ownership and returns the requested subject", async () => {
    const { resolveRequestedSubjectId } = await import("@/engine/dev");
    const userId = "00000000-0000-4000-8000-000000000001" as UserId;
    const subjectId = "00000000-0000-4000-8000-000000000099";

    const result = await resolveRequestedSubjectId(userId, subjectId);

    expect(assertSubjectOwned).toHaveBeenCalledWith(userId, subjectId);
    expect(result).toBe(subjectId);
  });

  it("uses the configured dev subject when none is requested", async () => {
    const { resolveRequestedSubjectId } = await import("@/engine/dev");
    const userId = "00000000-0000-4000-8000-000000000001" as UserId;

    const result = await resolveRequestedSubjectId(userId, null);

    expect(assertSubjectOwned).toHaveBeenCalledWith(
      userId,
      envState.devSubjectId
    );
    expect(result).toBe(envState.devSubjectId);
  });

  it("requires an explicit subject when dev fallback is disabled", async () => {
    envState.authDevFallback = false;
    const { resolveRequestedSubjectId } = await import("@/engine/dev");
    const userId = "00000000-0000-4000-8000-000000000001" as UserId;

    await expect(resolveRequestedSubjectId(userId, null)).rejects.toBeInstanceOf(
      FeedEngineError
    );
    expect(assertSubjectOwned).not.toHaveBeenCalled();
  });
});
