import { expect, test } from "@playwright/test";
import { loginAsDevUser } from "./helpers/auth";

test.describe("MVP study cycle", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDevUser(page);
  });

  test("authenticated user can study a seeded card in the feed", async ({
    page,
  }) => {
    await page.goto("/feed");

    await expect(page.getByRole("progressbar", { name: "Progresso sessione" })).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      page
        .getByText(
          /blurting|feynman|vero o falso|trova l'errore|scegli la risposta|fissa l'idea|collega l'illustrazione/i
        )
        .first()
    ).toBeVisible();

    const continueButton = page
      .getByRole("button", {
        name: /^ho capito$/i,
      })
      .first();

    if (await continueButton.isVisible()) {
      await continueButton.click();
    } else {
      const quizOption = page.locator("button").filter({ hasText: /./ }).nth(2);
      await quizOption.click();
    }

    await expect(
      page.getByText(/sessione completata|scorri verso l'alto|caricamento/i).first()
    ).toBeVisible({ timeout: 20_000 });
  });
});
