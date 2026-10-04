import { expect, test } from "@playwright/test";
import { assets, bubbles, clickBubble, openHome, openSettings } from "./helpers";

test("switches to the dark theme and keeps it after a reload", async ({ page }) => {
  await openHome(page);
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("logs out to the login page", async ({ page }) => {
  await openHome(page);
  await openSettings(page);
  await page.getByRole("button", { name: "Logout" }).click();

  await expect(page).toHaveURL("/login");
});

test.describe("accessibility mode", () => {
  test("is off by default: bubbles are plain shapes for the mouse", async ({ page }) => {
    await openHome(page);

    await expect(page.getByRole("button", { name: assets[0]!.name })).toHaveCount(0);
    // A click selects at once and doesn't focus the bubble
    await clickBubble(page, 0);
    await expect(page.getByRole("heading", { name: assets[0]!.name })).toBeVisible();
    await expect(bubbles(page).first()).not.toBeFocused();
  });

  test("makes the bubbles keyboard buttons, and is remembered", async ({ page }) => {
    await openHome(page);
    await openSettings(page);
    await page.getByRole("switch", { name: "Accessibility" }).click();
    await openSettings(page); // closes the menu

    const bubble = page.getByRole("button", { name: `${assets[0]!.name}, 1.54 MW` });
    await bubble.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: assets[0]!.name })).toBeVisible();
    await expect(bubble).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    await expect(page.getByRole("button", { name: `${assets[0]!.name}, 1.54 MW` })).toBeVisible();
  });
});
