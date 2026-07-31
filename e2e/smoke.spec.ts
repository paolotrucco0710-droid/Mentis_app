import { expect, test } from "@playwright/test";

test.describe("public smoke flows", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /accedi a mentis/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("signup page renders", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /crea il tuo account/i })).toBeVisible();
  });

  test("unauthenticated home redirects to login", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/);
  });
});
