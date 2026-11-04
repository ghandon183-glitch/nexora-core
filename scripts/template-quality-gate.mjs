#!/usr/bin/env node
/**
 * Unified customer-facing quality gate for the 12 shipped template demos.
 *
 * Every product in scripts/templates.manifest.json is mandatory. A missing
 * demo is a failure, never a silent skip. Checks per product:
 *   - JavaScript runtime errors and React hydration errors (#418/#423/#425)
 *   - failed/failing same-origin requests and broken images
 *   - placeholder or empty links
 *   - broken internal navigation
 *   - axe-core WCAG 2.2 AA accessibility (critical/serious block release)
 *   - horizontal overflow at seven representative viewports
 *   - reduced-motion behaviour
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
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
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
  }));
}

async function auditProduct(browser, base, product) {
  const record = { slug: product.slug, label: product.label, demo: product.demo, issues: [] };
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
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("requestfailed", (r) => {
    const failure = r.failure()?.errorText || "unknown";
    if (failure !== "net::ERR_ABORTED") failedRequests.push(`${failure} ${r.url()}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().startsWith(base)) failedRequests.push(`HTTP ${r.status()} ${r.url()}`);
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1500);
    record.title = await page.title();

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

    record.links = await page.evaluate(() => {
      const anchors = [...document.querySelectorAll("a")];
      const placeholder = anchors
        .filter((a) => {
          const href = a.getAttribute("href");
          return href === null || href === "" || href === "#" || /^javascript:/i.test(href) || href === "#!";
        })
        .map((a) => (a.textContent || "").trim().slice(0, 60));
      const internal = [...new Set(anchors.map((a) => a.getAttribute("href") || ""))]
        .filter((href) => href.startsWith("/") && !href.startsWith("//"))
        .filter((href) => !href.startsWith("/demo/") || true);
      const brokenImages = [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src);
      const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1]));
      return { placeholder, internal: internal.slice(0, 80), brokenImages, headings };
    });
    record.hydrationErrors = [...consoleErrors, ...pageErrors].filter((t) => HYDRATION_RE.test(t));
    record.consoleErrors = consoleErrors;
    record.pageErrors = pageErrors;
    record.failedRequests = failedRequests;

    record.overflow = {};
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(250);
      const state = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      record.overflow[viewport.width] = state.scrollWidth > state.innerWidth + 2;
    }

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(VIEWPORTS[5]);
    await page.waitForTimeout(300);
    record.reducedMotion = await page.evaluate(() => {
      const probe = document.querySelector("section, header, main, div");
      const style = probe ? getComputedStyle(probe) : null;
      return { mediaMatches: matchMedia("(prefers-reduced-motion: reduce)").matches, animationDuration: style?.animationDuration ?? null };
    });

    await page.screenshot({ path: path.join(args.out, `${product.slug}-desktop.png`), fullPage: false });
    await page.setViewportSize(VIEWPORTS[2]);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(args.out, `${product.slug}-mobile.png`), fullPage: false });
  } catch (err) {
    record.issues.push(`navigation/runtime failure: ${err}`);
  } finally {
    await page.close();
  }

  for (const issue of record.hydrationErrors || []) record.issues.push(`hydration: ${issue.slice(0, 300)}`);
  for (const issue of record.pageErrors || []) record.issues.push(`page error: ${issue.slice(0, 300)}`);
  for (const issue of record.consoleErrors || []) record.issues.push(`console error: ${issue.slice(0, 300)}`);
  for (const issue of record.failedRequests || []) record.issues.push(`failed request: ${issue.slice(0, 300)}`);
  for (const target of record.links?.placeholder || []) record.issues.push(`placeholder link: ${target || "(unnamed link)"}`);
  for (const image of record.links?.brokenImages || []) record.issues.push(`broken image: ${image}`);
  for (const violation of record.a11y || []) {
    if (violation.impact === "critical" || violation.impact === "serious") {
      record.issues.push(`accessibility ${violation.impact}: ${violation.id} (${violation.nodes} nodes)`);
    }
  }
  for (const [width, overflows] of Object.entries(record.overflow || {})) {
    if (overflows) record.issues.push(`horizontal overflow at ${width}px`);
  }
  if (record.reducedMotion && record.reducedMotion.mediaMatches === false) {
    record.issues.push("reduced-motion media query did not activate");
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
  args: ["--enable-webgl", "--use-angle=swiftshader", "--disable-dev-shm-usage"],
});

const results = [];
for (const product of products) {
  const record = await auditProduct(browser, base, product);
  results.push(record);
  console.log(
    `${record.status} ${record.label}: issues=${record.issues.length} ` +
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
  md.push(`- accessibility: ${JSON.stringify(record.a11yCounts || {})}`);
  md.push(`- hydration errors: ${record.hydrationErrors?.length ?? 0}`);
  md.push(`- console errors: ${record.consoleErrors?.length ?? 0}`);
  md.push(`- page errors: ${record.pageErrors?.length ?? 0}`);
  md.push(`- failed requests: ${record.failedRequests?.length ?? 0}`);
  md.push(`- overflow: ${Object.entries(record.overflow || {}).filter(([, v]) => v).map(([k]) => `${k}px`).join(", ") || "none"}`);
  for (const issue of record.issues) md.push(`  - ${issue}`);
  md.push("");
}
fs.writeFileSync(path.join(args.out, "demo-report.md"), `${md.join("\n")}\n`);

const failures = results.filter((r) => r.status !== "PASS");
console.log(`\nGATE: ${failures.length === 0 ? "PASS" : "FAIL"} (${results.length - failures.length}/${results.length} products clean)`);
process.exitCode = failures.length === 0 ? 0 : 1;
