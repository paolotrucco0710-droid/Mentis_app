import { describe, expect, it } from "vitest";
import {
  assertProductionEnv,
  collectProductionValidationIssues,
} from "@/lib/env.schema";

describe("lib/env.schema production validation", () => {
  it("returns no issues outside production", () => {
    expect(
      collectProductionValidationIssues({
        NODE_ENV: "development",
        AUTH_DEV_FALLBACK: "true",
      })
    ).toEqual([]);
  });

  it("collects production configuration issues", () => {
    const issues = collectProductionValidationIssues({
      NODE_ENV: "production",
      AUTH_JWT_SECRET: "dev-only-change-in-production-mentis",
      AUTH_DEV_FALLBACK: "true",
      STORAGE_PROVIDER: "local",
    });

    expect(issues.map((issue) => issue.field)).toEqual([
      "DATABASE_URL",
      "AUTH_JWT_SECRET",
      "AUTH_DEV_FALLBACK",
      "STORAGE_PROVIDER",
    ]);
  });

  it("throws when production configuration is invalid", () => {
    expect(() =>
      assertProductionEnv({
        NODE_ENV: "production",
        DATABASE_URL: "",
      })
    ).toThrow(/Configurazione produzione non valida/);
  });
});
