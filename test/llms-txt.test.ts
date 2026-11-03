import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { getAllTemplates } from "@/lib/data/get-template";

test("llms.txt links every public template and does not advertise hidden bundle checkout", () => {
  const content = readFileSync("public/llms.txt", "utf8");

  for (const template of getAllTemplates()) {
    assert.ok(
      content.includes(`/en/templates/${template.slug}`),
      `llms.txt must link the public template ${template.slug}`,
    );
  }

  assert.ok(content.includes("/en/bundle"));
  assert.doesNotMatch(content, /\/en\/checkout\/all-templates/);
  assert.match(content, /Bundle checkout is not enabled/i);
});
