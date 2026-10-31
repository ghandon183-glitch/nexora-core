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


test("product purchase CTA points to the localized checkout", async ({ page }) => {
  await page.goto("/en/templates/aether", { waitUntil: "domcontentloaded" });
  const purchaseLink = page.locator('a[href="/en/checkout/aether"]');
  await expect(purchaseLink).toBeVisible();
});

test("checkout requires authentication before payment can start", async ({ page }) => {
  await page.goto("/en/checkout/aether", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/en\/sign-in/);
  expect(page.url()).toContain("next=");
});

for (const route of ["/en/privacy", "/en/terms", "/en/license", "/en/refunds", "/en/faq", "/en/support"]) {
  test(`legal/support page is publicly reachable: ${route}`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response, `No document response for ${route}`).not.toBeNull();
    expect(response.status(), `HTTP status for ${route}`).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
  });
}

test("invalid download tokens are denied without caching", async ({ request }) => {
  const response = await request.get("/api/download/not-a-uuid");
  expect(response.status()).toBe(404);
  expect(response.headers()["cache-control"]).toBe("no-store");
});

test("robots and sitemap are publicly available", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap:");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("/en/templates/aether");
});
