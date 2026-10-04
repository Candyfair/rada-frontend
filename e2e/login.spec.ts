import { expect, test } from "@playwright/test";

// There is no real authentication yet: any submit goes to the map
test("goes from the login page to the map", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("operator@example.com");
  await page.getByLabel("Password", { exact: true }).fill("not-checked");

  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");

  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("g.bubble-node").first()).toBeAttached();
});
