import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import assetsJson from "../src/__fixtures__/assets.json" with { type: "json" };

// The assets served by the mock backend, in API order
export const assets = assetsJson;

// One <g> per asset, in API order
export const bubbles = (page: Page) => page.locator("g.bubble-node");

// The bubbles keep floating, so they are never "stable" for Playwright.
// Wait until the bubble only drifts (they spread out fast on load), then
// click its current centre.
export async function clickBubble(page: Page, index: number) {
  const bubble = bubbles(page).nth(index);
  const centre = async () => {
    const box = await bubble.boundingBox();
    if (!box) throw new Error(`bubble ${index} is not rendered`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };

  await expect
    .poll(
      async () => {
        const before = await centre();
        await page.waitForTimeout(100);
        const after = await centre();
        return Math.hypot(after.x - before.x, after.y - before.y);
      },
      { message: `bubble ${index} keeps moving fast` }
    )
    .toBeLessThan(3);

  const { x, y } = await centre();
  await page.mouse.click(x, y);
}

// Home page, once the bubbles are drawn
export async function openHome(page: Page) {
  await page.goto("/");
  await bubbles(page).first().waitFor();
}

export async function openSettings(page: Page) {
  await page.getByRole("button", { name: "Open settings" }).click();
}
