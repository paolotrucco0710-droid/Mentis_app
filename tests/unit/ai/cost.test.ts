import { describe, expect, it } from "vitest";
import { estimateModelCost } from "@/ai/optimization/cost";

describe("ai/optimization/cost", () => {
  it("estimates cost from token usage", () => {
    const cost = estimateModelCost("gpt-4o-mini", 1_000_000, 500_000);
    expect(cost).toBeGreaterThan(0);
  });

  it("charges vision models using vision rates", () => {
    const textCost = estimateModelCost("gpt-4o-mini", 1000, 1000);
    const visionCost = estimateModelCost("gpt-4o-mini-vision", 1000, 1000);
    expect(visionCost).toBe(textCost);
  });
});
