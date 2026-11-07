/**
 * Interaction tests for the four rebuilt marketplace demos.
 *
 * These exercise behaviour the load-and-audit pass in deep-template-quality.yml
 * cannot see: the Aurelia bag (add, quantity, subtotal, persistence across a
 * reload, removal), the Modern SaaS trial dialog (open, close, Escape), mobile
 * layout at 320/390px, reduced-motion rendering, and console/network health.
 *
 * Usage: BASE_URL=http://127.0.0.1:4174 node scripts/demo-interaction-tests.mjs
 */
import { chromium } from "playwright";
import axe from "axe-core";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:4174").replace(/\/$/, "");
const results = [];
const failures = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) {
    failures.push(`${name}: ${detail}`);
    process.stdout.write(`::error title=${name}::${String(detail).replace(/[%\r\n]+/g, " ").slice(0, 250)}\n`);
  }
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}

function watch(page) {
  const errors = [];
  const pageErrors = [];
  const failed = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("requestfailed", (r) => failed.push(r.url()));
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().startsWith(BASE)) failed.push(`${r.status()} ${r.url()}`);
  });
  return { errors, pageErrors, failed };
}

async function assertClean(name, page, watched) {
  const sameOriginFailed = watched.failed.filter((u) => u.includes(BASE) || u.startsWith("/"));
  record(`${name} console errors`, watched.errors.length === 0, watched.errors.slice(0, 3).join(" | "));
  record(`${name} page errors`, watched.pageErrors.length === 0, watched.pageErrors.slice(0, 3).join(" | "));
  record(`${name} failed requests`, sameOriginFailed.length === 0, sameOriginFailed.slice(0, 3).join(" | "));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  return { overflow, sameOriginFailed };
}

async function runAxe(page, name, label) {
  await page.addScriptTag({ content: axe.source });
  const { violations } = await page.evaluate(async () =>
    await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    }),
  );
  const important = violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  record(
    `${name} axe ${label}`,
    important.length === 0,
    important.map((v) => `${v.id}(${v.nodes.length})`).join(", "),
  );
}

async function aurelia(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const watched = watch(page);
  const name = "aurelia-store";

  await page.goto(`${BASE}/demo/aurelia-store/index.html`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(500);

  record(`${name} starts with an empty bag`, (await page.getByRole("button", { name: /^Open bag, 0 items$/ }).count()) === 1);

  const addButton = page.getByRole("button", { name: /^Add .+ to bag$/ }).first();
  await addButton.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 5000 });
  record(`${name} add to bag opens the drawer`, await dialog.isVisible());

  const subtotal = dialog.getByTestId("cart-subtotal");
  const firstSubtotal = (await subtotal.innerText()).trim();
  record(`${name} subtotal is not zero after adding`, firstSubtotal !== "$0", firstSubtotal);

  await page.getByRole("button", { name: /^Increase quantity of / }).first().click();
  await page.waitForTimeout(250);
  const afterIncrease = (await subtotal.innerText()).trim();
  record(`${name} increasing quantity raises the subtotal`, afterIncrease !== firstSubtotal, `${firstSubtotal} -> ${afterIncrease}`);
  record(
    `${name} bag count follows the quantity`,
    (await page.getByRole("button", { name: /^Open bag, 2 items$/ }).count()) === 1,
  );

  await page.getByRole("button", { name: /^Decrease quantity of / }).first().click();
  await page.waitForTimeout(250);
  record(`${name} decreasing quantity restores the subtotal`, (await subtotal.innerText()).trim() === firstSubtotal);

  await page.getByRole("button", { name: /^Checkout — / }).click();
  const status = dialog.getByRole("status");
  await status.waitFor({ state: "visible", timeout: 4000 }).catch(() => {});
  record(
    `${name} checkout states that no payment was taken`,
    (await status.count()) === 1 && /no payment was taken/i.test(await status.innerText()),
  );

  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  record(`${name} Escape closes the drawer`, !(await dialog.isVisible().catch(() => false)));

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Open bag, 1 item$/ }).click();
  await dialog.waitFor({ state: "visible", timeout: 5000 });
  const afterReload = (await subtotal.innerText()).trim();
  record(`${name} bag survives a reload`, afterReload === firstSubtotal, afterReload);

  await page.getByRole("button", { name: /^Remove .+ from bag$/ }).first().click();
  await page.waitForTimeout(300);
  const emptied = (await subtotal.innerText().catch(() => "")).trim();
  record(`${name} removing the last item empties the bag`, emptied === "$0" || /empty/i.test(await dialog.innerText()), emptied);

  await page.keyboard.press("Escape");
  await assertClean(name, page, watched);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.waitForTimeout(300);
  const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth > 326);
  record(`${name} no horizontal overflow at 320px`, !overflow320);
  await runAxe(page, name, "320px");
  await page.close();
}

async function modernSaas(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const watched = watch(page);
  const name = "modern-saas";

  await page.goto(`${BASE}/demo/modern-saas/index.html`, { waitUntil: "networkidle", timeout: 45000 });

  const cta = page.getByRole("button", { name: /start/i }).first();
  record(`${name} hero call to action exists`, (await cta.count()) > 0);
  await cta.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 5000 });
  record(`${name} call to action opens the trial dialog`, await dialog.isVisible());

  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  record(`${name} Escape closes the trial dialog`, !(await dialog.isVisible().catch(() => false)));

  const pricingCta = page.getByRole("button", { name: /start/i }).nth(1);
  if ((await pricingCta.count()) > 0) {
    await pricingCta.click();
    await dialog.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    record(`${name} pricing call to action opens the dialog`, await dialog.isVisible());
    await page.getByRole("button", { name: /close trial signup/i }).click();
    await dialog.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    record(`${name} close button dismisses the dialog`, !(await dialog.isVisible().catch(() => false)));
  } else {
    record(`${name} pricing call to action exists`, false, "no second start button found");
  }

  await assertClean(name, page, watched);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  record(
    `${name} no horizontal overflow at 390px`,
    !(await page.evaluate(() => document.documentElement.scrollWidth > 396)),
  );
  await runAxe(page, name, "390px");
  await page.close();
}

async function passiveDemo(browser, slug) {
  const context = await browser.newContext({ viewport: { width: 320, height: 800 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const watched = watch(page);
  await page.goto(`${BASE}/demo/${slug}/index.html`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(700);
  const { overflow } = await assertClean(slug, page, watched);
  record(`${slug} no horizontal overflow at 320px with reduced motion`, !overflow);
  await runAxe(page, slug, "320px reduced motion");
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await aurelia(browser);
  await modernSaas(browser);
  for (const slug of ["vesper", "aether"]) {
    await passiveDemo(browser, slug);
  }
} catch (error) {
  record("harness", false, String(error).slice(0, 250));
} finally {
  await browser.close();
}

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} interaction checks passed`);
if (failures.length) {
  console.log(`::error title=Demo interaction tests::${failures.length} check(s) failed: ${failures.slice(0, 5).join("; ")}`);
  process.exit(1);
}
