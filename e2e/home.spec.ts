import { expect, test } from "@playwright/test";
import { assets, bubbles, clickBubble, openHome, openSettings } from "./helpers";

test("shows one bubble per asset and the fleet total power", async ({ page }) => {
  await openHome(page);

  await expect(bubbles(page)).toHaveCount(assets.length);
  // summary.json: total_power_mw 833.36, rounded. The badge is drawn
  // twice (small and expanded), the expanded one faded out.
  await expect(page.getByText("833 MW").first()).toBeVisible();
});

test("opens the detail panel, then the detail page of a bubble", async ({ page }) => {
  await openHome(page);

  await clickBubble(page, 0);
  await expect(page.getByRole("heading", { name: assets[0]!.name })).toBeVisible();

  await page.getByRole("button", { name: "View asset details" }).click();
  // Values from asset-history-snapshot.json
  await expect(page.getByText("Voltage")).toBeVisible();
  await expect(page.getByText(/398\.\d+ V/)).toBeVisible();

  await page.getByRole("button", { name: "Go back" }).click();
  await page.getByRole("button", { name: "Close panel" }).click();
  await expect(page.getByRole("heading", { name: assets[0]!.name })).toBeHidden();
});

test("filters the map by asset type", async ({ page }) => {
  await openHome(page);
  await openSettings(page);
  const filters = page.getByRole("dialog", { name: "Filter assets" });

  // From "View all", a type switch shows that type only
  await filters.getByRole("switch", { name: "Battery" }).click();
  await expect(bubbles(page)).toHaveCount(assets.filter((a) => a.asset_type === "battery").length);
  await filters.getByRole("switch", { name: "Wind" }).click();
  await expect(bubbles(page)).toHaveCount(
    assets.filter((a) => a.asset_type === "battery" || a.asset_type === "wind").length
  );

  await filters.getByRole("switch", { name: "View all" }).click();
  await expect(bubbles(page)).toHaveCount(assets.length);

  await filters.getByRole("button", { name: "Apply filters" }).click();
  await expect(filters).toBeHidden();
});

test("switches the battery map between power and capacity", async ({ page }) => {
  await openHome(page);
  await openSettings(page);
  await page.getByRole("switch", { name: "Battery" }).click();
  await page.getByRole("button", { name: "Apply filters" }).click();

  // summary.json: batteries 25.3 MW, 0 MWh
  await expect(page.getByText("25 MW").first()).toBeVisible();
  await page.getByRole("button", { name: "Capacity" }).click();
  await expect(page.getByText("0 MWh").first()).toBeVisible();
});

test("shows the error when the backend can't be reached", async ({ page }) => {
  await page.route("**/api/assets", (route) =>
    route.fulfill({ status: 502, json: { detail: "Backend unreachable" } })
  );
  await page.goto("/");

  await expect(page.getByText("Error: HTTP 502")).toBeVisible();
});
