import { expect, type Locator, type Page } from "@playwright/test";

async function fillSurfaceTextarea(
  surface: Locator,
  text: string
): Promise<void> {
  const labelledField = surface.getByLabel(/la tua (risposta|spiegazione)/i);
  const placeholderField = surface.getByPlaceholder(
    /scrivi o parla|parole semplici/i
  );
  let answerField = surface.locator("textarea").first();

  if (await labelledField.count()) {
    answerField = labelledField.first();
  } else if (await placeholderField.count()) {
    answerField = placeholderField.first();
  }

  await expect(answerField).toBeVisible({ timeout: 10_000 });
  await answerField.fill(text);
}

export async function interactWithCurrentCardIfNeeded(page: Page): Promise<void> {
  const surface = page.getByTestId("feed-scroll-surface");

  if (await surface.getByText(/scegli la risposta corretta/i).isVisible()) {
    await surface.locator("button.rounded-2xl.border").first().click();
    return;
  }

  if (await surface.getByText(/^vero o falso\?$/i).isVisible()) {
    await surface.getByRole("button", { name: /^vero$/i }).click();
    return;
  }

  if (await surface.getByText(/^collegamento$/i).isVisible()) {
    await surface.locator("button.rounded-2xl.border").first().click();
    return;
  }

  if (await surface.getByText(/^trova l'errore$/i).isVisible()) {
    await surface.getByRole("button", { name: /sembr(a)? corretto/i }).click();
    return;
  }

  const blurtingFine = surface.getByRole("button", { name: /^fine$/i });
  if (
    (await surface.getByRole("heading", { name: /^blurting$/i }).isVisible()) &&
    (await blurtingFine.isVisible())
  ) {
    await fillSurfaceTextarea(
      surface,
      "La fotosintesi converte luce ed energia in zuccheri utili alla pianta."
    );
    await blurtingFine.click();
    await expect(page.getByText(/scorri verso l'alto/i)).toBeVisible({
      timeout: 20_000,
    });
    return;
  }

  const valutaSpiegazione = surface.getByRole("button", {
    name: /valuta spiegazione/i,
  });
  if (await valutaSpiegazione.isVisible()) {
    await fillSurfaceTextarea(
      surface,
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

  const { clientX, startY, endY } = await surface.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      clientX: rect.left + rect.width / 2,
      startY: rect.bottom - 32,
      endY: rect.top + 32,
    };
  });

  const startTouch = { identifier: 0, clientX, clientY: startY };
  await surface.dispatchEvent("touchstart", {
    touches: [startTouch],
    changedTouches: [startTouch],
    targetTouches: [startTouch],
  });

  const endTouch = { identifier: 0, clientX, clientY: endY };
  await surface.dispatchEvent("touchend", {
    touches: [],
    changedTouches: [endTouch],
    targetTouches: [],
  });
}
