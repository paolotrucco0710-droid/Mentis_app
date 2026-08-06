import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/v1/progress/responses/route";
import { SessionEventOutcome } from "@/domain/enums";

const { recordCardResponse } = vi.hoisted(() => ({
  recordCardResponse: vi.fn(),
}));

vi.mock("@/engine/dev", () => ({
  resolveDevUserId: vi.fn(async () => "00000000-0000-4000-8000-000000000001"),
}));

vi.mock("@/progress", () => ({
  recordCardResponse,
}));

describe("integration/api progress responses", () => {
  it("returns next feed when includeNextFeed is requested", async () => {
    recordCardResponse.mockResolvedValueOnce({
      sessionEventId: "00000000-0000-4000-8000-000000000301",
      masteryBefore: 10,
      masteryAfter: 15,
      masteryDelta: 5,
      unlockedAtomIds: [],
      subjectProgress: null,
      nextFeed: {
        item: {
          position: 2,
          sessionProgress: 0.4,
        },
        sessionComplete: false,
        rewards: [],
        notifications: [],
      },
    });

    const response = await POST(
      new Request("http://localhost/api/v1/progress/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "00000000-0000-4000-8000-000000000201",
          cardId: "00000000-0000-4000-8000-000000000202",
          atomId: "00000000-0000-4000-8000-000000000203",
          outcome: SessionEventOutcome.Success,
          isCorrect: true,
          includeNextFeed: true,
          knowledgeSourceId: "00000000-0000-4000-8000-000000000204",
        }),
      })
    );

    const body = (await response.json()) as {
      nextFeed?: { item: { position: number } };
    };

    expect(response.status).toBe(200);
    expect(recordCardResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        includeNextFeed: true,
        knowledgeSourceId: "00000000-0000-4000-8000-000000000204",
      })
    );
    expect(body.nextFeed?.item.position).toBe(2);
  });
});
