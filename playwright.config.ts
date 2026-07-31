import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AUTH_DEV_FALLBACK: process.env.AUTH_DEV_FALLBACK ?? "true",
      DEV_USER_ID: process.env.DEV_USER_ID ?? "00000000-0000-4000-8000-000000000001",
      DEV_SUBJECT_ID:
        process.env.DEV_SUBJECT_ID ?? "00000000-0000-4000-8000-000000000002",
      NEXT_PUBLIC_DEV_SUBJECT_ID:
        process.env.NEXT_PUBLIC_DEV_SUBJECT_ID ??
        "00000000-0000-4000-8000-000000000002",
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://mentis:mentis@localhost:5432/mentis_test",
      AUTH_JWT_SECRET:
        process.env.AUTH_JWT_SECRET ?? "test-secret-for-ci-only-mentis-32chars",
    },
  },
});
