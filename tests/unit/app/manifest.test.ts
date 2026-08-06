import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("app/manifest", () => {
  it("exposes a standalone PWA manifest for Mentis", () => {
    const config = manifest();

    expect(config.name).toBe("Mentis");
    expect(config.start_url).toBe("/home");
    expect(config.display).toBe("standalone");
    expect(config.icons?.[0]?.src).toBe("/icon.svg");
  });
});
