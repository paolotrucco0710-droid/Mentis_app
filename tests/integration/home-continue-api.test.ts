import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/home/continue/route";

const { getHomeContinueContext } = vi.hoisted(() => ({
  getHomeContinueContext: vi.fn(),
}));

vi.mock("@/engine/dev", () => ({
  resolveDevUserId: vi.fn(async () => "00000000-0000-4000-8000-000000000001"),
}));

vi.mock("@/home", () => ({
  getHomeContinueContext,
}));

describe("integration/api home continue", () => {
  it("returns continue context for the current user", async () => {
    getHomeContinueContext.mockResolvedValueOnce({
      canContinue: true,
      reason: "recent_chapter",
      chapter: {
        id: "00000000-0000-4000-8000-000000000030",
        title: "Cellula",
        subjectId: "00000000-0000-4000-8000-000000000010",
        subjectName: "Biologia",
        knowledgeSourceId: "00000000-0000-4000-8000-000000000020",
        atomCount: 6,
      },
      session: null,
      feedHref:
        "/feed?subjectId=00000000-0000-4000-8000-000000000010&knowledgeSourceId=00000000-0000-4000-8000-000000000020",
    });

    const response = await GET(new Request("http://localhost/api/v1/home/continue"));
    const body = (await response.json()) as {
      context: { canContinue: boolean; feedHref: string | null };
    };

    expect(response.status).toBe(200);
    expect(body.context.canContinue).toBe(true);
    expect(body.context.feedHref).toContain("knowledgeSourceId=");
  });
});
