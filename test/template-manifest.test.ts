import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { getAllTemplates, getTemplate } from "@/lib/data/get-template";
import { DOWNLOADS } from "@/lib/data/downloads";

interface ManifestProduct {
  slug: string;
  label: string;
  zip: string;
  demo: string;
  runtime: "next" | "vite";
}

const manifest = JSON.parse(readFileSync("scripts/templates.manifest.json", "utf8")) as {
  products: ManifestProduct[];
};

test("the release manifest lists exactly the 12 sellable products", () => {
  assert.equal(manifest.products.length, 12);
  assert.equal(new Set(manifest.products.map((product) => product.slug)).size, 12);
});

test("every manifest product is a real marketplace product with a downloadable ZIP", () => {
  const publicTemplateSlugs = getAllTemplates().map((template) => template.slug);

  for (const product of manifest.products) {
    assert.ok(getTemplate(product.slug), `manifest slug is not in templates.ts: ${product.slug}`);
    assert.ok(publicTemplateSlugs.includes(product.slug), `manifest slug is not public: ${product.slug}`);
    assert.equal(
      DOWNLOADS[product.slug],
      `/downloads/${product.zip}`,
      `downloads.ts must point ${product.slug} at ${product.zip}`,
    );
    assert.ok(existsSync(`public/downloads/${product.zip}`), `missing customer ZIP: ${product.zip}`);
  }
});

test("every manifest product ships a buildable demo export", () => {
  for (const product of manifest.products) {
    assert.ok(
      existsSync(`public/demo/${product.demo}/index.html`),
      `missing demo export for ${product.label}: public/demo/${product.demo}/index.html`,
    );
  }
});

test("shipped demos contain no placeholder or dead links", () => {
  for (const product of manifest.products) {
    const html = readFileSync(`public/demo/${product.demo}/index.html`, "utf8");
    assert.doesNotMatch(
      html,
      /href=(?:"#?"|"#\s*"|'#')/,
      `${product.label} ships a placeholder href="#" link`,
    );
  }
});
