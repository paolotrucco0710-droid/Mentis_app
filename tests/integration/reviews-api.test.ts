import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/reviews/daily/route";
import { POST } from "@/app/api/v1/reviews/sync/route";

const { generateDailyReview, syncReviewsForUser } = vi.hoisted(() => ({
  generateDailyReview: vi.fn(),
  syncReviewsForUser: vi.fn(),
}));

vi.mock("@/engine/dev", () => ({
  resolveDevUserId: vi.fn(async () => "00000000-0000-4000-8000-000000000001"),
  resolveRequestedSubjectId: vi.fn(
    async (_userId: string, subjectId: string | null) => subjectId
  ),
}));

vi.mock("@/review", () => ({
  generateDailyReview,
  syncReviewsForUser,
}));

describe("integration/api reviews", () => {
  it("returns the daily review plan", async () => {
    generateDailyReview.mockResolvedValueOnce({
      date: "2026-08-06",
      dueNow: [],
      overdue: [],
      upcomingToday: [],
      totalDue: 0,
      estimatedMinutes: 0,
    });

    const response = await GET(
      new Request(
        "http://localhost/api/v1/reviews/daily?subjectId=00000000-0000-4000-8000-000000000010"
      )
    );
    const body = (await response.json()) as { totalDue: number };

    expect(response.status).toBe(200);
    expect(body.totalDue).toBe(0);
    expect(generateDailyReview).toHaveBeenCalledWith({
      userId: "00000000-0000-4000-8000-000000000001",
      subjectId: "00000000-0000-4000-8000-000000000010",
    });
  });

  it("syncs scheduled reviews for the current user", async () => {
    syncReviewsForUser.mockResolvedValueOnce(3);

    const response = await POST(
      new Request("http://localhost/api/v1/reviews/sync", { method: "POST" })
    );
    const body = (await response.json()) as { synced: number };

    expect(response.status).toBe(200);
    expect(body.synced).toBe(3);
  });
});
