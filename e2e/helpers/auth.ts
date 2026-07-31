import { expect, type Page } from "@playwright/test";
import { DEV_SEED_USER } from "../../tests/fixtures/dev-user";

export async function loginAsDevUser(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(DEV_SEED_USER.email);
  await page.getByLabel(/password/i).fill(DEV_SEED_USER.password);
  await page.getByRole("button", { name: /^accedi$/i }).click();
  await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
}
