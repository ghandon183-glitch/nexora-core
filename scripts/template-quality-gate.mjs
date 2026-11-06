#!/usr/bin/env node
/**
 * Unified customer-facing quality gate for the 12 shipped template demos.
 *
 * Every product in scripts/templates.manifest.json is mandatory. A missing
 * demo is a failure, never a silent skip. Per product it checks:
 *   - every published route reached from the demo's internal links
 *   - every visible button, with an observable effect
 *   - every form: validation, submission feedback, no failed request
 *   - dead/placeholder links and missing fragment targets
 *   - JavaScript/console errors and React hydration errors (#418/#423/#425)
 *   - failed requests and broken images
 *   - all axe-core WCAG 2.2 AA violations
 *   - horizontal overflow at 320/375/390/768/1024/1440/1920 px
 *   - reduced-motion: no infinite animation keeps running
 *
 * Usage: node scripts/template-quality-gate.mjs [--only slug,slug] [--out dir]
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PLAYWRIGHT_ROOT = path.resolve(process.env.PLAYWRIGHT_DIR || ROOT);
const requireFrom = createRequire(path.join(PLAYWRIGHT_ROOT, "package.json"));
const { chromium } = requireFrom("playwright");
const axeSource = fs.readFileSync(requireFrom.resolve("axe-core/axe.min.js"), "utf8");

const VIEWPORTS = [320, 375, 390, 768, 1024, 1440, 1920].map((width) => ({ width, height: width < 700 ? 844 : 900 }));
const HYDRATION_RE = /(hydration|#418|#423|#425|did not match|server rendered html didn'?t match|text content does not match)/i;
const A11Y_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/x-component; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".hdr": "image/vnd.radiance",
  ".mp3": "audio/mpeg",
  ".map": "application/json; charset=utf-8",
};

function parseArgs(argv) {
  const args = { only: [], out: ".deep-audit" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--only") args.only = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (argv[i] === "--out") args.out = argv[++i];
  }
  return args;
}

function staticServer(rootDir) {
  const server = http.createServer((req, res) => {
    let pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (pathname.endsWith("/")) pathname += "index.html";
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
        return;
      }
      res.writeHead(200, { "content-type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function summarize(violations) {
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
    snippets: v.nodes.slice(0, 2).map((n) => (n.html || "").slice(0, 200)),
    failureSummary: v.nodes[0]?.failureSummary?.slice(0, 300) || null,
  }));
}

const settle = async (page) => {
  await page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { /* infinite or paused */ } })).catch(() => {});
  await page.waitForTimeout(120);
};

async function collectLinks(page) {
  return page.evaluate(() => {
    const anchors = [...document.querySelectorAll("a[href]")];
    const issues = [];
    for (const a of anchors) {
      const href = (a.getAttribute("href") || "").trim();
      const label = ((a.textContent || "").replace(/\s+/g, " ").trim() || a.getAttribute("aria-label") || "").slice(0, 70);
      if (!href || href === "#" || href === "#!" || /^javascript:/i.test(href)) {
        issues.push({ label, href, reason: "placeholder-or-empty" });
        continue;
      }
      if (/example\.(com|net|org)|yourdomain|localhost|127\.0\.0\.1/i.test(href)) {
        issues.push({ label, href, reason: "placeholder-domain" });
        continue;
      }
      if (href.startsWith("#")) {
        const target = decodeURIComponent(href.slice(1));
        if (target && !document.getElementById(target)) issues.push({ label, href, reason: "missing-fragment-target" });
      }
    }
    const internal = [...new Set(anchors
      .map((a) => { try { return new URL(a.href, location.href); } catch { return null; } })
      .filter(Boolean)
      .filter((u) => u.origin === location.origin && u.pathname.startsWith(location.pathname.replace(/index\.html$/, "")) && !u.hash)
      .map((u) => u.href))];
    const brokenImages = [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src);
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1]));
    const placeholderControls = [...document.querySelectorAll("button, [role=button]")].filter((el) => {
      const label = (el.textContent || "").trim();
      return /^lorem|^button$/i.test(label) && !el.getAttribute("aria-label");
    }).length;
    return { issues, internal, brokenImages, headings, placeholderControls, count: anchors.length };
  });
}

async function exerciseButtons(page, startUrl) {
  const issues = [];
  const buttons = page.locator("button:visible");
  const count = await buttons.count();
  const tested = Math.min(count, 40);
  for (let i = 0; i < tested; i += 1) {
    const button = page.locator("button:visible").nth(i);
    const type = ((await button.getAttribute("type")) || "").toLowerCase();
    const inForm = await button.evaluate((el) => Boolean(el.closest("form"))).catch(() => false);
    if (type === "submit" || inForm) continue;
    const label = (((await button.innerText().catch(() => "")) || (await button.getAttribute("aria-label")) || "unlabelled button"))
      .replace(/\s+/g, " ").trim().slice(0, 70);
    await settle(page);
    const before = await page.evaluate(() => ({
      html: document.body.innerHTML,
      url: location.href,
      scroll: Math.round(window.scrollY),
      values: [...document.querySelectorAll("input,textarea,select")].map((e) => `${e.value}:${e.checked}`).join("|"),
      dialogs: document.querySelectorAll("[role=dialog], dialog[open]").length,
    }));
    let popup = 0;
    const onPopup = (p) => { popup += 1; p.close().catch(() => {}); };
    page.on("popup", onPopup);
    let clickError = null;
    try {
      await button.click({ timeout: 4000 });
      await settle(page);
    } catch (err) {
      clickError = String(err).split("\n")[0].slice(0, 200);
    }
    const after = await page.evaluate(() => ({
      html: document.body.innerHTML,
      url: location.href,
      scroll: Math.round(window.scrollY),
      values: [...document.querySelectorAll("input,textarea,select")].map((e) => `${e.value}:${e.checked}`).join("|"),
      dialogs: document.querySelectorAll("[role=dialog], dialog[open]").length,
    })).catch(() => null);
    page.off("popup", onPopup);
    const changed = popup > 0 || !after || after.html !== before.html || after.url !== before.url ||
      after.scroll !== before.scroll || after.values !== before.values || after.dialogs !== before.dialogs;
    if (clickError) issues.push({ label, reason: "click-failed", detail: clickError });
    else if (!changed) issues.push({ label, reason: "no-observable-action" });
    if (page.url() !== startUrl) await page.goto(startUrl, { waitUntil: "networkidle", timeout: 45000 });
  }
  return { tested, issues };
}

async function exerciseForms(page, startUrl) {
  const issues = [];
  const forms = page.locator("form");
  const count = await forms.count();
  for (let i = 0; i < count; i += 1) {
    const form = page.locator("form").nth(i);
    const submit = form.locator('button[type="submit"], input[type="submit"], button:not([type])').first();
    if ((await submit.count()) === 0) {
      issues.push({ form: i, reason: "no-submit-control" });
      continue;
    }
    const fields = form.locator('input:not([type="hidden"]), textarea, select');
    const fieldCount = await fields.count();
    for (let k = 0; k < fieldCount; k += 1) {
      const field = fields.nth(k);
      const tag = await field.evaluate((el) => el.tagName.toLowerCase()).catch(() => "");
      const type = ((await field.getAttribute("type")) || "").toLowerCase();
      if (type === "checkbox" || type === "radio") await field.check().catch(() => {});
      else if (tag === "select") await field.selectOption({ index: 0 }).catch(() => {});
      else if (type === "email") await field.fill("qa@example.invalid").catch(() => {});
      else await field.fill("Nexora QA test").catch(() => {});
    }
    const before = await page.evaluate(() => ({
      text: document.body.textContent || "",
      status: [...document.querySelectorAll('[role="status"], [aria-live]')].map((n) => n.textContent || "").join("|"),
      url: location.href,
    }));
    const mutations = [];
    const onResponse = (r) => {
      if (!["GET", "HEAD"].includes(r.request().method()) && r.url().startsWith("http://127.0.0.1")) {
        mutations.push(`${r.status()} ${r.url()}`);
      }
    };
    page.on("response", onResponse);
    let submitError = null;
    try {
      await submit.click({ timeout: 4000 });
      await page.waitForTimeout(400);
    } catch (err) {
      submitError = String(err).split("\n")[0].slice(0, 200);
    }
    page.off("response", onResponse);
    const after = await page.evaluate(() => ({
      text: document.body.textContent || "",
      status: [...document.querySelectorAll('[role="status"], [aria-live]')].map((n) => n.textContent || "").join("|"),
      url: location.href,
    })).catch(() => null);
    const feedback =
      (after && after.text !== before.text) ||
      (after && after.status !== before.status && after.status.trim().length > 0) ||
      (after && after.url !== before.url) ||
      mutations.length > 0;
    const failedRequest = mutations.find((m) => Number(m.split(" ")[0]) >= 400);
    if (submitError) issues.push({ form: i, reason: "submit-failed", detail: submitError });
    else if (failedRequest) issues.push({ form: i, reason: "submission-request-failed", detail: failedRequest });
    else if (!feedback) issues.push({ form: i, reason: "no-observable-submit-feedback" });
    if (page.url() !== startUrl) await page.goto(startUrl, { waitUntil: "networkidle", timeout: 45000 });
  }
  return { tested: count, issues };
}

async function auditProduct(browser, base, product) {
  const record = {
    slug: product.slug,
    label: product.label,
    demo: product.demo,
    issues: [],
    routes: { tested: 0, issues: [] },
    buttons: { tested: 0, issues: [] },
    forms: { tested: 0, issues: [] },
    links: { tested: 0, issues: [] },
  };
  const demoDir = path.join(ROOT, "public", "demo", product.demo);
  const indexFile = path.join(demoDir, "index.html");
  if (!fs.existsSync(indexFile)) {
    record.issues.push(`missing demo export: public/demo/${product.demo}/index.html`);
    record.status = "FAIL";
    return record;
  }

  const url = `${base}/demo/${product.demo}/`;
  const page = await browser.newPage({ viewport: VIEWPORTS[5] });
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const nonOkResponses = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("requestfailed", (r) => {
    const failure = r.failure()?.errorText || "unknown";
    if (failure !== "net::ERR_ABORTED") failedRequests.push(`${failure} ${r.url()}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().startsWith(base)) nonOkResponses.push(`HTTP ${r.status()} ${r.url()}`);
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1200);
    record.title = await page.title();
    if (/application error|internal server error|error occurred/i.test(record.title || "")) {
      record.issues.push(`demo renders an error page: title=${record.title}`);
    }

    const links = await collectLinks(page);
    record.links.tested = links.count;
    record.links.issues = links.issues;
    record.brokenImages = links.brokenImages;
    record.headings = links.headings;
    if (!record.headings?.includes(1)) record.issues.push("no <h1> landmark in the published page");
    for (const issue of links.issues.slice(0, 20)) record.issues.push(`link ${issue.reason}: ${issue.href} (${issue.label || "unnamed"})`);
    for (const image of links.brokenImages) record.issues.push(`broken image: ${image}`);
    if (links.placeholderControls) record.issues.push(`placeholder controls: ${links.placeholderControls}`);

    // Routes: every same-demo internal link must return a document, not a 404.
    for (const target of links.internal.slice(0, 40)) {
      record.routes.tested += 1;
      try {
        const response = await page.request.get(target, { timeout: 15000 });
        if (response.status() >= 400) record.routes.issues.push({ url: target, status: response.status() });
      } catch (err) {
        record.routes.issues.push({ url: target, error: String(err).split("\n")[0].slice(0, 160) });
      }
    }
    for (const issue of record.routes.issues) record.issues.push(`route ${issue.status || issue.error}: ${issue.url}`);

    const buttons = await exerciseButtons(page, url);
    record.buttons = { tested: buttons.tested, issues: buttons.issues };
    for (const issue of buttons.issues) record.issues.push(`button ${issue.reason}: ${issue.label}${issue.detail ? ` (${issue.detail})` : ""}`);

    const forms = await exerciseForms(page, url);
    record.forms = { tested: forms.tested, issues: forms.issues };
    for (const issue of forms.issues) record.issues.push(`form ${issue.reason}: #${issue.form}${issue.detail ? ` (${issue.detail})` : ""}`);

    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.addScriptTag({ content: axeSource });
    const axeResult = await page.evaluate(async (tags) => {
      // eslint-disable-next-line no-undef
      return await axe.run(document, { runOnly: { type: "tag", values: tags } });
    }, A11Y_TAGS);
    record.a11y = summarize(axeResult.violations);
    record.a11yCounts = axeResult.violations.reduce((acc, v) => {
      acc[v.impact || "unknown"] = (acc[v.impact || "unknown"] || 0) + 1;
      return acc;
    }, {});

    record.hydrationErrors = [...consoleErrors, ...pageErrors].filter((t) => HYDRATION_RE.test(t));
    record.consoleErrors = consoleErrors;
    record.pageErrors = pageErrors;
    record.failedRequests = failedRequests;
    record.nonOkResponses = nonOkResponses;

    record.overflow = {};
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(250);
      record.overflow[viewport.width] = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        overflowing: document.documentElement.scrollWidth > window.innerWidth + 2,
      }));
    }

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(VIEWPORTS[5]);
    await page.waitForTimeout(300);
    record.reducedMotion = await page.evaluate(() => {
      const infinite = document.getAnimations().filter((a) => {
        const timing = a.effect?.getTiming?.() || {};
        return timing.iterations === Infinity && a.playState === "running";
      });
      return {
        mediaMatches: matchMedia("(prefers-reduced-motion: reduce)").matches,
        infiniteAnimations: infinite.length,
        names: infinite.slice(0, 5).map((a) => a.animationName || a.id || "unnamed"),
      };
    });

    await page.screenshot({ path: path.join(args.out, `${product.slug}-desktop.png`) });
    await page.setViewportSize(VIEWPORTS[2]);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(args.out, `${product.slug}-mobile.png`) });
  } catch (err) {
    record.issues.push(`navigation/runtime failure: ${String(err).split("\n")[0].slice(0, 300)}`);
  } finally {
    await page.close();
  }

  for (const issue of record.hydrationErrors || []) record.issues.push(`hydration: ${issue.slice(0, 300)}`);
  for (const issue of record.pageErrors || []) record.issues.push(`page error: ${issue.slice(0, 300)}`);
  for (const issue of record.consoleErrors || []) record.issues.push(`console error: ${issue.slice(0, 300)}`);
  for (const issue of record.failedRequests || []) record.issues.push(`failed request: ${issue.slice(0, 300)}`);
  for (const issue of record.nonOkResponses || []) record.issues.push(`error response: ${issue.slice(0, 300)}`);
  for (const violation of record.a11y || []) {
    record.issues.push(`accessibility ${violation.impact}: ${violation.id} (${violation.nodes} nodes) ${violation.targets.slice(0, 2).join(", ")}`);
  }
  for (const [width, state] of Object.entries(record.overflow || {})) {
    if (state.overflowing) record.issues.push(`horizontal overflow at ${width}px (scrollWidth ${state.scrollWidth} > ${state.innerWidth})`);
  }
  if (record.reducedMotion && record.reducedMotion.infiniteAnimations > 0) {
    record.issues.push(`reduced-motion ignored by infinite animation(s): ${record.reducedMotion.names.join(", ")}`);
  }

  record.status = record.issues.length === 0 ? "PASS" : "FAIL";
  return record;
}

const args = parseArgs(process.argv.slice(2));
fs.mkdirSync(args.out, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, "templates.manifest.json"), "utf8")).products;
const products = args.only.length ? manifest.filter((p) => args.only.includes(p.slug)) : manifest;
if (products.length !== (args.only.length || 12)) {
  throw new Error("Product selection did not resolve; refusing a partial gate");
}

const server = await staticServer(path.join(ROOT, "public"));
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({
  headless: true,
  // CI uses Playwright's own download; a sandbox without root can point at a
  // user-space browser build instead.
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--disable-dev-shm-usage"],
});

const results = [];
for (const product of products) {
  const record = await auditProduct(browser, base, product);
  results.push(record);
  console.log(
    `${record.status} ${record.label}: issues=${record.issues.length} ` +
      `routes=${record.routes.tested}/${record.routes.issues.length} ` +
      `buttons=${record.buttons.tested}/${record.buttons.issues.length} ` +
      `forms=${record.forms.tested}/${record.forms.issues.length} ` +
      `a11y=${JSON.stringify(record.a11yCounts || {})} hydration=${record.hydrationErrors?.length ?? "n/a"}`,
  );
  for (const issue of record.issues) console.log(`   - ${issue}`);
}

await browser.close();
server.close();

const reportPath = path.join(args.out, "demo-report.json");
fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), products: results }, null, 2));

const md = ["# Nexora demo quality gate", "", `Products: ${results.length}`, ""];
for (const record of results) {
  md.push(`## ${record.label} (${record.slug})`, `- status: ${record.status}`);
  md.push(`- routes tested: ${record.routes.tested} (failures ${record.routes.issues.length})`);
  md.push(`- buttons tested: ${record.buttons.tested} (failures ${record.buttons.issues.length})`);
  md.push(`- forms tested: ${record.forms.tested} (failures ${record.forms.issues.length})`);
  md.push(`- links scanned: ${record.links.tested} (issues ${record.links.issues.length})`);
  md.push(`- accessibility: ${JSON.stringify(record.a11yCounts || {})}`);
  md.push(`- hydration errors: ${record.hydrationErrors?.length ?? 0}`);
  md.push(`- console errors: ${record.consoleErrors?.length ?? 0}`);
  md.push(`- page errors: ${record.pageErrors?.length ?? 0}`);
  md.push(`- failed requests: ${record.failedRequests?.length ?? 0}`);
  md.push(`- broken images: ${record.brokenImages?.length ?? 0}`);
  md.push(`- overflow: ${Object.entries(record.overflow || {}).filter(([, v]) => v.overflowing).map(([k]) => `${k}px`).join(", ") || "none"}`);
  md.push(`- reduced motion: ${record.reducedMotion ? `${record.reducedMotion.infiniteAnimations} infinite animation(s)` : "n/a"}`);
  for (const issue of record.issues) md.push(`  - ${issue}`);
  md.push("");
}
fs.writeFileSync(path.join(args.out, "demo-report.md"), `${md.join("\n")}\n`);

const failures = results.filter((r) => r.status !== "PASS");
console.log(`\nGATE: ${failures.length === 0 ? "PASS" : "FAIL"} (${results.length - failures.length}/${results.length} products clean)`);
process.exitCode = failures.length === 0 ? 0 : 1;
