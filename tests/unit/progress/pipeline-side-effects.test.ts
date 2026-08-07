import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("progress pipeline side effects", () => {
  it("awaits unlock and review scheduling after recording a response", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/progress/pipeline.ts"),
      "utf8"
    );

    expect(source).toContain("await unlockAtomsUnlockedByPrerequisite");
    expect(source).toContain("await scheduleReviewForAtom");
    expect(source).toContain("unlockedAtomIds,");
    expect(source).not.toContain("void unlockAtomsUnlockedByPrerequisite");
    expect(source).not.toContain("void scheduleReviewForAtom");
  });
});
