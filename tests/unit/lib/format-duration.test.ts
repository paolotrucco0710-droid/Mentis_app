import { describe, expect, it } from "vitest";
import { formatStudyDuration } from "@/lib/format-duration";
import { buildSessionSummaryView } from "@/components/feed/session-summary";
import { SessionStatus } from "@/session/types";

describe("formatStudyDuration", () => {
  it("formats short sessions in minutes", () => {
    expect(formatStudyDuration(90_000)).toBe("2 min");
  });

  it("formats longer sessions with hours", () => {
    expect(formatStudyDuration(3_900_000)).toBe("1 h 5 min");
  });
});

describe("buildSessionSummaryView", () => {
  it("maps end session metrics into a summary view", () => {
    const summary = buildSessionSummaryView(
      {
        session: {
          id: "00000000-0000-4000-8000-000000000101",
          userId: "00000000-0000-4000-8000-000000000001",
          subjectId: "00000000-0000-4000-8000-000000000201",
          startedAt: new Date(),
          endedAt: new Date(),
          durationMs: 600_000,
          cardsViewed: 12,
          atomsCompleted: 2,
          reviewsCompleted: 0,
          errorCount: 1,
          correctAnswerCount: 8,
          focusScore: 70,
          fatigueScore: 20,
          initialMotivation: null,
          finalMotivation: null,
          device: null,
          appVersion: null,
        },
        status: SessionStatus.Ended,
        metrics: {
          accuracy: 80,
          activeDurationMs: 600_000,
          pauseCount: 0,
          totalPauseMs: 0,
          cardsPerMinute: 1.2,
          focusScore: 70,
          fatigueScore: 20,
        },
      },
      {
        conceptsStudied: ["Fotosintesi", "Clorofilla"],
        masteryGain: 6,
      }
    );

    expect(summary.cardsViewed).toBe(12);
    expect(summary.conceptsStudied).toHaveLength(2);
    expect(summary.masteryGain).toBe(6);
  });
});
