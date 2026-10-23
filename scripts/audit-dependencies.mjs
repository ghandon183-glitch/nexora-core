import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ALLOWED_ADVISORY = "GHSA-vfj7-8cjw-p6xm";
const ALLOWED_DEV_CHAIN = new Set([
  "braces",
  "micromatch",
  "fast-glob",
  "@next/eslint-plugin-next",
  "eslint-config-next",
]);

function runAudit(args, { json = false } = {}) {
  const result = spawnSync("npm", ["audit", ...args], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });

  if (json) {
    try {
      return { result, report: JSON.parse(result.stdout || "{}") };
    } catch {
      process.stderr.write(result.stderr || "");
      process.stderr.write("Could not parse npm audit JSON output.\n");
      process.exit(1);
    }
  }

  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  return { result };
}

// Production dependencies must have no high or critical advisories.
console.log("Security gate: auditing production dependencies (blocking).");
const production = runAudit(["--omit=dev", "--audit-level=high"]);
if (production.result.status !== 0) {
  console.error("Production dependency audit failed.");
  process.exit(production.result.status ?? 1);
}

// Also inspect the complete dependency graph. The only temporary exception is
// GHSA-vfj7-8cjw-p6xm in braces <=3.0.3. As of 2026-10-23, the advisory lists
// no patched release. Its reported chain is dev-only ESLint tooling; it is not
// accepted if it appears in the production dependency graph or with any other
// high/critical advisory. Revisit by 2026-12-01.
console.log("Security gate: inspecting the complete dependency graph.");
const { result: fullResult, report } = runAudit(["--json"], { json: true });
if (!report.vulnerabilities || !report.metadata) {
  console.error("npm audit returned an incomplete report; failing closed.");
  process.exit(1);
}

const highFindings = Object.entries(report.vulnerabilities).filter(([, vulnerability]) =>
  ["high", "critical"].includes(vulnerability.severity)
);

if (highFindings.length === 0) {
  console.log("Full dependency audit: no high or critical advisories.");
  process.exit(0);
}

const braces = report.vulnerabilities.braces;
const hasExpectedAdvisory = Boolean(
  braces &&
  (braces.via ?? []).some(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof item.url === "string" &&
      item.url.toLowerCase().includes(ALLOWED_ADVISORY.toLowerCase())
  )
);

const exceptionIsExact =
  hasExpectedAdvisory &&
  highFindings.every(([name, vulnerability]) => {
    if (!ALLOWED_DEV_CHAIN.has(name)) return false;
    const via = vulnerability.via ?? [];
    return via.length > 0 && via.every((item) => {
      if (typeof item === "string") return ALLOWED_DEV_CHAIN.has(item);
      return Boolean(
        item &&
        typeof item === "object" &&
        typeof item.url === "string" &&
        item.url.toLowerCase().includes(ALLOWED_ADVISORY.toLowerCase())
      );
    });
  });

if (!exceptionIsExact) {
  console.error("Full dependency audit has high/critical findings outside the documented dev-only exception.");
  for (const [name, vulnerability] of highFindings) {
    console.error(`- ${name}: ${vulnerability.severity}; via=${JSON.stringify(vulnerability.via)}`);
  }
  process.exit(fullResult.status ?? 1);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const productionDirectDeps = Object.keys(packageJson.dependencies ?? {});
if ([...ALLOWED_DEV_CHAIN].some((name) => productionDirectDeps.includes(name))) {
  console.error("The allowlisted ESLint dependency chain unexpectedly appears in direct production dependencies.");
  process.exit(1);
}

console.warn(
  `Full audit exception (dev-only, temporary): ${ALLOWED_ADVISORY} via ${highFindings.map(([name]) => name).join(", ")}. No patched braces release is listed; review by 2026-12-01. Production audit passed.`
);
