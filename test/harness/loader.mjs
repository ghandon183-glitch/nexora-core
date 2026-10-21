import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Resolve hooks so application source (which uses the `@/` alias and
// extensionless relative imports) can be imported directly by node:test.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STUB_DIR = path.join(ROOT, "test/harness/stubs");

// Cloudflare/Next runtime bindings and outbound side effects are replaced by
// deterministic doubles. Everything else (order state machine, outbox locking,
// webhook signature verification) runs as the production code.
const STUBS = {
  "next/server": path.join(STUB_DIR, "next-server.mjs"),
  "@opennextjs/cloudflare": path.join(STUB_DIR, "cloudflare.mjs"),
  "@/lib/env": path.join(STUB_DIR, "env.mjs"),
  "@/lib/mailer": path.join(STUB_DIR, "mailer.mjs"),
  "resend": path.join(STUB_DIR, "resend.mjs"),
  "next/headers": path.join(STUB_DIR, "next-headers.mjs"),
};

const EXTENSIONS = [".ts", ".tsx", ".mjs", ".js", ".json"];

function probe(base) {
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;

  for (const extension of EXTENSIONS) {
    const candidate = base + extension;
    if (fs.existsSync(candidate)) return candidate;
  }

  for (const extension of EXTENSIONS) {
    const candidate = path.join(base, "index" + extension);
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const stub = STUBS[specifier];
  if (stub) return { url: pathToFileURL(stub).href, shortCircuit: true };

  if (specifier.startsWith("@/")) {
    const resolved = probe(path.join(ROOT, specifier.slice(2)));
    if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }

  const isRelative = specifier.startsWith(".") && context.parentURL?.startsWith("file:");
  const hasExtension = /\.[cm]?[jt]sx?$|\.json$/.test(specifier);

  if (isRelative && !hasExtension) {
    const parentDirectory = path.dirname(fileURLToPath(context.parentURL));
    const resolved = probe(path.resolve(parentDirectory, specifier));
    if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}
