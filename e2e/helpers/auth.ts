import { expect, type Page } from "@playwright/test";
import { DEV_SEED_USER } from "../../tests/fixtures/dev-user";

export async function completeOnboardingIfNeeded(page: Page): Promise<void> {
  if (!page.url().includes("/onboarding")) {
    return;
  }

  await page.getByRole("button", { name: /salta per ora/i }).click();
  await expect(page).toHaveURL(/\/upload/, { timeout: 15_000 });
}

export async function loginAsDevUser(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(DEV_SEED_USER.email);
  await page.getByLabel(/password/i).fill(DEV_SEED_USER.password);
  await page.getByRole("button", { name: /^accedi$/i }).click();
  await expect(page).toHaveURL(/\/(home|onboarding)/, { timeout: 15_000 });
  await completeOnboardingIfNeeded(page);
}
