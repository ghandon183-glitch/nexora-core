import assert from "node:assert/strict";
import { test } from "node:test";

import { getRelatedTemplates, getTemplate } from "@/lib/data/get-template";

test("related template links exclude the current template and return a small relevant set", () => {
  const current = getTemplate("modern-saas");
  assert.ok(current);

  const related = getRelatedTemplates("modern-saas");

  assert.equal(related.length, 3);
  assert.ok(related.every((template) => template.slug !== current.slug));
  assert.ok(related.some((template) => template.tags.some((tag) => tag.toLowerCase() === "saas")));
});

test("related template limit is bounded and handles unknown current slugs", () => {
  assert.equal(getRelatedTemplates("not-a-real-template", 2).length, 2);
  assert.equal(getRelatedTemplates("modern-saas", 0).length, 0);
});
