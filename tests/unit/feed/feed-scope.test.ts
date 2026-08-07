import { describe, expect, it } from "vitest";
import {
  buildFeedScopeKey,
  shouldResetFeedForScopeChange,
} from "@/components/feed/feed-scope";

describe("feed-scope", () => {
  const subjectA = "00000000-0000-4000-8000-000000000001";
  const subjectB = "00000000-0000-4000-8000-000000000002";
  const chapterA = "00000000-0000-4000-8000-000000000101";
  const chapterB = "00000000-0000-4000-8000-000000000102";

  it("builds a stable scope key for subject and chapter", () => {
    expect(buildFeedScopeKey(subjectA, chapterA)).toBe(`${subjectA}:${chapterA}`);
    expect(buildFeedScopeKey(subjectA, null)).toBe(`${subjectA}:`);
  });

  it("detects when the feed scope changed", () => {
    const firstScope = buildFeedScopeKey(subjectA, chapterA);
    const sameScope = buildFeedScopeKey(subjectA, chapterA);
    const newSubjectScope = buildFeedScopeKey(subjectB, chapterA);
    const newChapterScope = buildFeedScopeKey(subjectA, chapterB);

    expect(shouldResetFeedForScopeChange(null, firstScope)).toBe(false);
    expect(shouldResetFeedForScopeChange(firstScope, sameScope)).toBe(false);
    expect(shouldResetFeedForScopeChange(firstScope, newSubjectScope)).toBe(true);
    expect(shouldResetFeedForScopeChange(firstScope, newChapterScope)).toBe(true);
  });
});
