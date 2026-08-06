import { afterEach, describe, expect, it, vi } from "vitest";

describe("instrumentation register", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("skips production env validation on the edge runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");

    const registerProductionEnv = vi.fn(async () => undefined);
    vi.doMock("@/lib/register-production-env", () => ({
      registerProductionEnv,
    }));

    const { register } = await import("@/instrumentation");
    await register();

    expect(registerProductionEnv).not.toHaveBeenCalled();
  });

  it("runs production env validation on the node runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    const registerProductionEnv = vi.fn(async () => undefined);
    vi.doMock("@/lib/register-production-env", () => ({
      registerProductionEnv,
    }));

    const { register } = await import("@/instrumentation");
    await register();

    expect(registerProductionEnv).toHaveBeenCalledOnce();
  });
});
