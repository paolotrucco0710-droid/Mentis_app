import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "@/ai/optimization/batching";

describe("ai/optimization/batching", () => {
  it("returns an empty array for empty input", async () => {
    await expect(mapWithConcurrency([], 2, async () => "x")).resolves.toEqual([]);
  });

  it("maps all items preserving order", async () => {
    const result = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => value * 2);
    expect(result).toEqual([2, 4, 6, 8]);
  });

  it("respects concurrency limits", async () => {
    let active = 0;
    let maxActive = 0;

    await mapWithConcurrency([1, 2, 3, 4, 5], 2, async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return true;
    });

    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
