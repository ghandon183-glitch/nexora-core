import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Installs the resolve hooks used by the payment/webhook regression tests.
// Tests run on the built-in node:test runner with native TypeScript type
// stripping, so no extra test framework or bundler is required.
register("./loader.mjs", pathToFileURL(import.meta.filename));
