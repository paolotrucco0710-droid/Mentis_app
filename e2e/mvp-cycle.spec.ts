import { expect, test } from "@playwright/test";

test.describe("MVP study cycle", () => {
  test("authenticated user can study a seeded card in the feed", async ({
    page,
  }) => {
    await page.goto("/feed");

    await expect(
      page.getByRole("heading", { name: /spiegazione|quiz|blurting|feynman|vero o falso|trova l'errore|immagine/i }).first()
    ).toBeVisible({ timeout: 20_000 });

    const continueButton = page.getByRole("button", {
      name: /ho capito|continua|verifica|invia/i,
    }).first();

    await expect(continueButton).toBeVisible();
    await continueButton.click();

    await expect(
      page.getByText(/sessione completata|spiegazione|quiz|blurting|feynman|vero o falso|trova l'errore|immagine/i).first()
    ).toBeVisible({ timeout: 20_000 });
  });
});
