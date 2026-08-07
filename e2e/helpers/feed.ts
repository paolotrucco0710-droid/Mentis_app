import { expect, type Page } from "@playwright/test";

export async function interactWithCurrentCardIfNeeded(page: Page): Promise<void> {
  const surface = page.getByTestId("feed-scroll-surface");

  if (await page.getByText(/scegli la risposta corretta/i).isVisible()) {
    await surface.locator("button.rounded-2xl.border").first().click();
    return;
  }

  if (await page.getByText(/^vero o falso\?$/i).isVisible()) {
    await page.getByRole("button", { name: /^vero$/i }).click();
    return;
  }

  if (await page.getByText(/^collegamento$/i).isVisible()) {
    await surface.locator("button.rounded-2xl.border").first().click();
    return;
  }

  if (await page.getByText(/^trova l'errore$/i).isVisible()) {
    await page.getByRole("button", { name: /sembr(a)? corretto/i }).click();
    return;
  }

  const blurtingFine = page.getByRole("button", { name: /^fine$/i });
  if (await blurtingFine.isVisible()) {
    await page.getByLabel(/la tua risposta/i).fill(
      "La fotosintesi converte luce ed energia in zuccheri utili alla pianta."
    );
    await blurtingFine.click();
    await expect(page.getByText(/scorri verso l'alto/i)).toBeVisible({
      timeout: 20_000,
    });
    return;
  }

  const valutaSpiegazione = page.getByRole("button", {
    name: /valuta spiegazione/i,
  });
  if (await valutaSpiegazione.isVisible()) {
    await page.getByLabel(/la tua spiegazione/i).fill(
      "Spiego il concetto con parole semplici, come a un amico."
    );
    await valutaSpiegazione.click();
    await expect(page.getByText(/scorri verso l'alto/i)).toBeVisible({
      timeout: 20_000,
    });
  }
}

export async function swipeUpOnFeed(page: Page): Promise<void> {
  const surface = page.getByTestId("feed-scroll-surface");
  await expect(surface).toBeVisible();

  await surface.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });

  await surface.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const startY = rect.bottom - 32;
    const endY = rect.top + 32;

    const makeTouch = (clientY: number): Touch =>
      ({
        identifier: 1,
        target: element,
        clientX,
        clientY,
        pageX: clientX,
        pageY: clientY,
        screenX: clientX,
        screenY: clientY,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1,
      }) as Touch;

    const startTouch = makeTouch(startY);
    element.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        cancelable: true,
        touches: [startTouch],
        targetTouches: [startTouch],
        changedTouches: [startTouch],
      })
    );

    const endTouch = makeTouch(endY);
    element.dispatchEvent(
      new TouchEvent("touchend", {
        bubbles: true,
        cancelable: true,
        touches: [],
        targetTouches: [],
        changedTouches: [endTouch],
      })
    );
  });
}
