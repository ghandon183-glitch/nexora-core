import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/en",
  "/en/templates",
  "/en/pricing",
  "/en/templates/aether",
  "/en/license",
  "/en/refunds",
];

for (const route of publicRoutes) {
  test(`public route renders without a server error: ${route}`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response, `No document response for ${route}`).not.toBeNull();
    expect(response.status(), `HTTP status for ${route}`).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
  });
}

test("AETHER preview defers the external iframe until the visitor asks to load it", async ({ page }) => {
  await page.goto("/en/templates/aether", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /explore aether live/i })).toBeVisible();

  const iframe = page.locator('iframe[title="AETHER live interactive demo"]');
  await expect(iframe).toHaveCount(0);
  const loadButton = page.getByRole("button", { name: /load interactive demo/i });
  await expect(loadButton).toBeVisible();
  await loadButton.click();
  await expect(iframe).toHaveCount(1);
});

test("product gallery controls have accessible names and expand the preview", async ({ page }) => {
  await page.goto("/en/templates/aether", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /previous preview image/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /next preview image/i })).toBeVisible();
  await page.getByRole("button", { name: /expand preview image/i }).click();
  await expect(page.getByRole("dialog", { name: /full-size template preview/i })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /full-size template preview/i })).toHaveCount(0);
});
