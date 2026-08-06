import { beforeEach, describe, expect, it, vi } from "vitest";
import { KnowledgeSourceProcessingStatus } from "@/domain/enums";
import { SessionStatus } from "@/session/types";
import type { AtomId, ChapterId, KnowledgeSourceId, StudySessionId, SubjectId, UserId } from "@/domain/ids";

const userId = "00000000-0000-4000-8000-000000000001" as UserId;
const subjectId = "00000000-0000-4000-8000-000000000010" as SubjectId;
const knowledgeSourceId = "00000000-0000-4000-8000-000000000020" as KnowledgeSourceId;
const chapterId = "00000000-0000-4000-8000-000000000030" as ChapterId;
const atomId = "00000000-0000-4000-8000-000000000040" as AtomId;
const sessionId = "00000000-0000-4000-8000-000000000050" as StudySessionId;

const {
  findOpenStudySessionsByUserId,
  findSessionEventsBySessionId,
  findAtomById,
  findChapterByKnowledgeSourceId,
  findKnowledgeSourceById,
  findSubjectById,
  findMostRecentlyViewedUserAtomState,
  getLibraryOverview,
  resolveSessionStatus,
} = vi.hoisted(() => ({
  findOpenStudySessionsByUserId: vi.fn(),
  findSessionEventsBySessionId: vi.fn(),
  findAtomById: vi.fn(),
  findChapterByKnowledgeSourceId: vi.fn(),
  findKnowledgeSourceById: vi.fn(),
  findSubjectById: vi.fn(),
  findMostRecentlyViewedUserAtomState: vi.fn(),
  getLibraryOverview: vi.fn(),
  resolveSessionStatus: vi.fn(),
}));

vi.mock("@/db/repositories/study-sessions", () => ({
  findOpenStudySessionsByUserId,
}));

vi.mock("@/db/repositories/session-events", () => ({
  findSessionEventsBySessionId,
}));

vi.mock("@/db/repositories/atoms", () => ({
  findAtomById,
  countAtomsByKnowledgeSourceId: vi.fn(async () => 5),
}));

vi.mock("@/db/repositories/chapters", () => ({
  findChapterByKnowledgeSourceId,
}));

vi.mock("@/db/repositories/knowledge-sources", () => ({
  findKnowledgeSourceById,
}));

vi.mock("@/db/repositories/subjects", () => ({
  findSubjectById,
}));

vi.mock("@/db/repositories/user-atom-states", () => ({
  findMostRecentlyViewedUserAtomState,
}));

vi.mock("@/course", () => ({
  getLibraryOverview,
}));

vi.mock("@/session/state", () => ({
  resolveSessionStatus,
}));

import { getHomeContinueContext } from "@/home/service";

function mockChapterContext() {
  findChapterByKnowledgeSourceId.mockResolvedValue({
    id: chapterId,
    title: "Fotosintesi",
    subjectId,
    knowledgeSourceId,
  });
  findKnowledgeSourceById.mockResolvedValue({
    id: knowledgeSourceId,
    processingStatus: KnowledgeSourceProcessingStatus.Completed,
    deletedAt: null,
  });
  findSubjectById.mockResolvedValue({
    id: subjectId,
    name: "Biologia",
  });
}

describe("home/getHomeContinueContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findOpenStudySessionsByUserId.mockResolvedValue([]);
    findMostRecentlyViewedUserAtomState.mockResolvedValue(null);
    getLibraryOverview.mockResolvedValue({ subjects: [], recentChapters: [] });
  });

  it("prioritizes a paused session with chapter context", async () => {
    findOpenStudySessionsByUserId.mockResolvedValue([
      {
        id: sessionId,
        subjectId,
        cardsViewed: 4,
        endedAt: null,
      },
    ]);
    findSessionEventsBySessionId.mockResolvedValue([
      {
        atomId,
        type: "open_card",
      },
    ]);
    resolveSessionStatus.mockReturnValue(SessionStatus.Paused);
    findAtomById.mockResolvedValue({
      id: atomId,
      knowledgeSourceId,
    });
    mockChapterContext();

    const context = await getHomeContinueContext(userId);

    expect(context.canContinue).toBe(true);
    expect(context.reason).toBe("paused_session");
    expect(context.session?.id).toBe(sessionId);
    expect(context.chapter?.title).toBe("Fotosintesi");
    expect(context.feedHref).toBe(
      `/feed?subjectId=${subjectId}&knowledgeSourceId=${knowledgeSourceId}&sessionId=${sessionId}`
    );
  });

  it("falls back to the last studied chapter", async () => {
    findMostRecentlyViewedUserAtomState.mockResolvedValue({
      atomId,
      lastViewedAt: new Date("2026-08-06T10:00:00.000Z"),
    });
    findAtomById.mockResolvedValue({
      id: atomId,
      knowledgeSourceId,
    });
    mockChapterContext();

    const context = await getHomeContinueContext(userId);

    expect(context.canContinue).toBe(true);
    expect(context.reason).toBe("last_chapter");
    expect(context.session).toBeNull();
    expect(context.feedHref).toBe(
      `/feed?subjectId=${subjectId}&knowledgeSourceId=${knowledgeSourceId}`
    );
  });

  it("uses the most recent study-ready chapter when nothing else is available", async () => {
    getLibraryOverview.mockResolvedValue({
      subjects: [],
      recentChapters: [
        {
          id: chapterId,
          title: "Cellula",
          subjectId,
          knowledgeSourceId,
          atomCount: 8,
          knowledgeSource: {
            processingStatus: KnowledgeSourceProcessingStatus.Completed,
          },
        },
      ],
    });
    findSubjectById.mockResolvedValue({
      id: subjectId,
      name: "Biologia",
    });

    const context = await getHomeContinueContext(userId);

    expect(context.canContinue).toBe(true);
    expect(context.reason).toBe("recent_chapter");
    expect(context.chapter?.title).toBe("Cellula");
  });

  it("returns none when there is no resumable material", async () => {
    const context = await getHomeContinueContext(userId);

    expect(context).toEqual({
      canContinue: false,
      reason: "none",
      chapter: null,
      session: null,
      feedHref: null,
    });
  });
});
