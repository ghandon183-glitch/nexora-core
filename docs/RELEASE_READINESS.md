# Nexora Core — template release readiness

_Last updated by the productization hardening run on this branch._

## Scope

Twelve products are treated as separate customer deliverables:

Vesper · Admin Dashboard · AETHER · Aurelia Store · Creative Agency · Kiln Estates ·
Modern SaaS · Nexi AI · Premium Blog · Premium Portfolio · Premium Restaurant · Solace Studio

`scripts/templates.manifest.json` is the single source of truth for those 12 products. Both
the archive verifier and the browser gate read it, and `test/template-manifest.test.ts`
fails if a product, ZIP or demo disappears from the manifest.

## Changes in this run

1. **Unified release gate.** `.github/workflows/deep-template-quality.yml` previously ran two
   divergent checks: package checks that treated lint failures as advisory, and a demo audit
   that made only Vesper's accessibility findings release-blocking and silently `continue`d
   when a demo was missing (AETHER had no demo at all). It is replaced by one blocking gate
   built on two shared scripts:
   - `scripts/verify-template-packages.py` — ZIP integrity (CRC), safe paths, required
     documentation, no bundled build output or local env files, committed-secret scan,
     then clean install, production build, lint and `npm audit --audit-level=high --omit=dev`.
   - `scripts/template-quality-gate.mjs` — every demo, with no skip path: runtime errors,
     React hydration errors (#418/#423/#425), failed same-origin requests, broken images,
     placeholder/empty links, axe-core WCAG 2.2 AA, horizontal overflow at 320/375/390/
     768/1024/1440/1920 px, and reduced-motion activation.
2. **Archive hardener defects fixed.** `scripts/harden-template-archives.py` wrote literal
   `\n` characters into shipped stylesheets (invalid CSS) and could append duplicate,
   conflicting contrast rules. Both are fixed, and re-running the hardener now removes the
   earlier residue.
3. **Nexi AI consistency and honesty.** The shipped ZIP and the deployed demo were built from
   different revisions: the demo still carried `href="#"` links, the old marketing metadata
   and post-build string patches. The demo is now rebuilt from the hardened source, so the
   embedded React flight payload and rendered markup agree. The hardener also replaces the
   remaining fabricated claims (uptime SLA, "2.4M+ conversations", customer testimonials),
   fixes the logo link, and rewrites the metadata description to describe the template
   truthfully.
4. **Dead links removed** in Aurelia Store and Modern SaaS sources; rebuilt demos contain no
   `href="#"`.
5. **AETHER demo restored.** `scripts/audit-template-packages.yml` built AETHER without a
   `basePath`, so its assets could not resolve under `/demo/aether/`. The demo is now built
   with `basePath: /demo/aether`, a pinned Turbopack root and `trailingSlash`, and is
   published under `public/demo/aether/`.

## Verified evidence (this environment)

- `npm test`: **120/120 pass**, including the new manifest/gate tests.
- `npm run lint`, `npx tsc --noEmit`: run on the final tree (see commit notes).
- Archive structure for all 12 ZIPs: integrity PASS, required docs PASS, no build
  artifacts, `.env.example` present, no committed-secret patterns.
- Clean install and `npm audit --audit-level=high --omit=dev`: **PASS for all 12**.
- Demos exist and build for all 12 products; 4 were rebuilt from corrected source
  (Nexi AI, Modern SaaS, Aurelia Store, AETHER).

## Build/lint results observed by the archive verifier

| Product | Install | Build | Lint | npm audit (high+) |
| --- | --- | --- | --- | --- |
| Vesper | PASS | PASS | PASS | PASS |
| Admin Dashboard | PASS | PASS | PASS | PASS |
| AETHER | PASS | PASS | FAIL | PASS |
| Aurelia Store | PASS | PASS | FAIL | PASS |
| Creative Agency | PASS | FAIL | PASS | PASS |
| Kiln Estates | PASS | FAIL | PASS | PASS |
| Modern SaaS | PASS | PASS | PASS | PASS |
| Nexi AI | PASS | PASS | PASS | PASS |
| Premium Blog | PASS | FAIL | FAIL | PASS |
| Premium Portfolio | PASS | FAIL | — | PASS |
| Premium Restaurant | PASS | PASS | FAIL | PASS |
| Solace Studio | PASS | FAIL | FAIL | PASS |

These build and lint failures were reproduced from the shipped ZIPs by
`scripts/verify-template-packages.py`, which is blocking. They are **not fixed yet** and
are the next required work; see "Unresolved" below.

## Unresolved

- Creative Agency, Kiln Estates, Premium Blog, Premium Portfolio and Solace Studio ship
  production-build failures; AETHER, Aurelia Store, Premium Blog, Premium Restaurant and
  Solace Studio ship lint failures. The gate now reports these as release blockers.
- Browser-level demo verification (axe-core, hydration, interactions, responsive overflow)
  could **not** be executed in this sandbox: Chromium's runtime libraries are absent and the
  environment has no root access (`apt` has no package lists, `--with-deps` needs sudo). The
  gate runs on GitHub Actions `ubuntu-24.04`, where `npx playwright install --with-deps
  chromium` is available. No browser pass is claimed here.
- Nexi AI hydration was not re-confirmed in a browser for the same reason. The identified
  root cause (stale demo built from a different source revision plus post-build text
  patching) is removed by rebuilding the demo from the hardened source.
- Purchase/order/download delivery was not exercised: that requires the deployed Cloudflare
  environment and the existing test-mode fixtures. The payment, PayMeGate and Gmail systems
  were not modified.
- Commercial licensing of third-party imagery/fonts was not re-verified; only
  `ASSET-LICENSES.md` presence is checked automatically.

## Product status

No product is marked READY. The acceptance criteria require a passing browser gate and a
passing build/lint/audit result for each ZIP, and the table above shows that several products
still fail.
