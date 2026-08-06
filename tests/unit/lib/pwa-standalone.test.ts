import { describe, expect, it } from "vitest";
import { detectStandaloneMode } from "@/lib/pwa/standalone";

describe("lib/pwa/standalone", () => {
  it("returns false when window is unavailable", () => {
    expect(detectStandaloneMode()).toBe(false);
  });
});
