import assert from "node:assert/strict";
import { test } from "node:test";

import { getTemplate } from "@/lib/data/get-template";
import { seoGuides } from "@/lib/data/seo-guides";

test("every SEO guide links to three distinct visible template detail pages", () => {
  for (const guide of seoGuides) {
    assert.equal(guide.relatedTemplateSlugs.length, 3, guide.slug);
    assert.equal(new Set(guide.relatedTemplateSlugs).size, 3, guide.slug);

    for (const slug of guide.relatedTemplateSlugs) {
      const template = getTemplate(slug);
      assert.ok(template, `${guide.slug} references missing template ${slug}`);
      assert.ok(!template.hidden, `${guide.slug} links to hidden template ${slug}`);
    }
  }
});
