import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { assets, openHome } from "./helpers";

async function compareFirstAsset(page: Page) {
  await openHome(page);
  await page.getByRole("button", { name: "View statistics" }).click();
  const stats = page.getByRole("dialog", { name: "Fleet statistics" });

  await stats.getByRole("button", { name: "Select assets" }).click();
  await stats.getByRole("button", { name: assets[0]!.name, exact: true }).click();
  await expect(stats.locator(".recharts-line-curve")).toHaveCount(1);
  return stats;
}

test("draws the history of the selected asset", async ({ page }) => {
  const stats = await compareFirstAsset(page);

  await stats.getByRole("button", { name: "Energy" }).click();
  await expect(stats.locator(".recharts-line-curve")).toHaveCount(1);

  await stats.getByRole("button", { name: `Remove ${assets[0]!.name}` }).click();
  await expect(stats.getByText("Select an asset to display the chart.")).toBeVisible();
});

// The app shows Paris time on every device: a user in New York picks
// Paris times, and the backend gets the matching UTC times
test.describe("on a device outside France", () => {
  test.use({ timezoneId: "America/New_York" });

  test("reads and sends the date range in Paris time", async ({ page }) => {
    // The chart opens on the last 5 hours: 11:00 to 16:00 UTC
    await page.clock.setFixedTime(new Date("2026-10-03T16:00:00Z"));
    const stats = await compareFirstAsset(page);
    const start = stats.getByRole("textbox", { name: "Start date" });
    const end = stats.getByRole("textbox", { name: "End date" });

    await expect(start).toHaveValue("2026-10-03T13:00");
    await expect(end).toHaveValue("2026-10-03T18:00");

    await start.fill("2026-10-03T09:30");
    await end.fill("2026-10-03T12:00");
    const request = page.waitForRequest((req) => req.url().includes("/api/asset-history"));
    await stats.getByRole("button", { name: "Apply" }).click();

    const params = new URL((await request).url()).searchParams;
    expect(params.get("from_ts")).toBe("2026-10-03T07:30:00.000Z");
    expect(params.get("to_ts")).toBe("2026-10-03T10:00:00.000Z");
  });
});
