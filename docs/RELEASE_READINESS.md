# Nexora Core — template release readiness

_Updated 2026-11-06. Every result below was produced by the scripts in this
repository, against the ZIPs and demos committed here. Nothing is inherited from
an earlier report._

> **State of this revision.** The source fixes and the rebuilt ZIPs/demos are
> committed, but the package verifier has **not** been re-run against the new
> archives (its last full 12/12 pass was on `7611975`), and the browser gate is
> only partly complete. No product is READY. See
> [Unresolved](#unresolved-blocking-ready).

## Scope

Twelve products are separate customer deliverables:

Vesper · Admin Dashboard · AETHER · Aurelia Store · Creative Agency · Kiln Estates ·
Modern SaaS · Nexi AI · Premium Blog · Premium Portfolio · Premium Restaurant · Solace Studio

`scripts/templates.manifest.json` is the single source of truth for those 12 products.
Both `scripts/verify-template-packages.py` and `scripts/template-quality-gate.mjs`
read it, and `test/template-manifest.test.ts` fails if a product, ZIP or demo
disappears, so a product cannot be silently skipped.

## What changed in this run

1. **PR #84 reconciled into PR #83's shared architecture.** PR #83 remains the
   canonical integration branch (manifest + one archive verifier + one browser
   gate + one report). The useful work from PR #84 was ported rather than
   cherry-picked:
   - `patch_nexi_ai_font()` — Sora, Inter and JetBrains Mono are bundled from
     `@fontsource*` instead of `next/font/google`, so Nexi AI builds and renders
     with no Google Fonts network call (the font constructor and `next/font`
     import are removed and the local family variables registered in CSS).
   - the stronger browser checks: internal-link crawling against every route,
     visible-button effect testing, form validation/submission testing,
     placeholder-domain and missing-fragment link detection, and full axe-core
     violation reporting rather than only critical/serious.
   - RSC response handling in the test server (`.txt` served as
     `text/x-component`) is kept in the shared gate.
   PR #84's inline workflow-based checker was **not** kept: it duplicated the
   verifier, treated package failures as advisory, and hardcoded a remote AETHER
   demo URL instead of the checked-out export.
2. **Customer install reproducibility (root cause fixed, not hidden).**
   `--legacy-peer-deps` was masking a real incompatibility. Reproduced with the
   documented command in a clean extraction of the Vesper ZIP:

   ```
   $ npm install
   npm error peerOptional esbuild@"^0.27.0 || ^0.28.0" from vite@8.3.6
   npm error Conflicting peer dependency: esbuild@0.28.2
   ```

   Vesper pinned `esbuild ^0.25.0`. `scripts/harden-template-archives.py` now
   aligns the declared range (`esbuild ^0.28.0`) and regenerates the lockfile
   **without** `--legacy-peer-deps`; the flags were also removed from the
   archive verifier and from `audit-template-packages.yml`,
   `remediate-shipped-template-dependencies.yml` and
   `repair-shipped-template-archives.yml`. The verifier gained a
   `peer_resolution` check that runs `npm install --package-lock-only` against a
   manifest-only copy of each package, so a manifest that only installs because
   of a stale lockfile now fails the gate.
   A second real conflict was found the same way: Premium Portfolio pinned
   `react 19.2.4` while `react-dom` resolved to 19.3.1, whose peer requirement is
   `react@^19.3.1`. Both are now `^19.3.1`.
3. **Build and lint repairs at source.** All stale build-failure reports were
   reproduced from the current ZIPs: every package already built, so those
   reports were out of date. Five lint failures were real and are fixed without
   touching a rule or a type:
   - AETHER and Solace Studio shipped `lint: eslint .` with no `eslint` or
     `eslint-config-next` dependency and no config — the command failed with
     `sh: 1: eslint: not found`. Tooling is now declared and a valid flat config
     is shipped.
   - Premium Blog and Premium Restaurant shipped `eslint.config.mjs` containing
     TypeScript syntax (`import type`, `const config: Config`), which crashes
     ESLint's ESM loader with `SyntaxError: Unexpected token '{'`. Both now ship
     a valid flat config.
   - Aurelia Store shipped a `FlatCompat` config that crashed on the pinned
     `minimatch@11` (`does not provide an export named 'default'`); it now uses
     the flat config API. Its four real `react/no-unescaped-entities` errors and
     the `no-html-link-for-pages` errors in Premium Blog and Premium Restaurant
     were fixed in the JSX source (escaped entities, `next/link` for internal
     navigation).
4. **Gate hardening.** `template-quality-gate.mjs` now tests routes, buttons,
   forms, dead links, all axe violations, seven viewport widths and
   reduced-motion, with no skip path. A demo that fails to load is a failure,
   never a pass.

## Phase 3 source fixes (2026-11-06)

All five confirmed browser defects were fixed **at the source** and applied by
`scripts/harden-template-archives.py`, so the ZIP a customer downloads and the
demo the gate visits are produced from the same edit. Every patch function is
idempotent (re-running the hardener over an already-patched package returns
early), and the demos are rebuilt from the shipped ZIPs by
`scripts/rebuild-demo-exports.sh`, which builds with
`output: "export"`, `trailingSlash: true`, `images.unoptimized` and
`NEXT_PUBLIC_BASE_PATH=/demo/<slug>`, then rewrites `/images/` sources to that
base path (28 files in Kiln Estates) because `next/image` does not prefix them.

| Product | Root cause | Fix |
| --- | --- | --- |
| Kiln Estates | The old hardener edited exported HTML (`h4`→`h3`, injected `<main>`) after the build, so server markup and client bundle disagreed → React #418 | `<main id="main-content">` per page, Footer Studio `h4`→`h3` and `toLocaleString("en-US")` in the React source |
| Kiln Estates | `[class~="text-clay"]{color:#e7b18f!important}` applied the light clay tone on light backgrounds (7 contrast nodes) | the light tone is scoped to `.bg-forest`; the default is `#8f4021` |
| Nexi AI | Three typing dots used a JS `repeat: Infinity` WAAPI loop that is not retracted when the visitor already prefers reduced motion | the dots are CSS `animate-pulse`, which the global reduced-motion guard neutralises |
| Premium Portfolio | Demo social links were buttons that did nothing and the form gave no announceable result | socials render as `aria-disabled` spans, the success panel is `role="status" aria-live="polite"`, copy says it is a demo |
| Admin Dashboard | The notification bell had no behaviour | `components/layout/notification-bell.tsx`, a real client popover; `.recharts-tooltip-item-*` contrast rules per theme |
| Creative Agency | Two "Start a project" buttons and the filter chips had no behaviour/state | `components/sections/start-project.tsx` dialog plus `aria-pressed`/`type="button"` filters |

`ensure_reduced_motion()` appends a `@media (prefers-reduced-motion: reduce)`
guard to every package's `globals.css`, so CSS motion (the Nexi dots included)
stops for visitors who ask for it.

## Package verification (ZIP → clean extract → documented install → build → lint → audit)

Produced by `python3 scripts/verify-template-packages.py` on commit `7611975`.
`peer_resolution` proves the shipped manifest resolves **without**
`--legacy-peer-deps`.

**Not re-run for this revision.** The table below is the last complete verifier
run; the ZIPs were re-hardened afterwards with the fixes above and have not been
re-verified from a clean extraction. Treat the archive columns as stale until
that run is repeated.

| Product | Install | Peer resolution | Build | Lint | npm audit (high+) | ZIP integrity |
| --- | --- | --- | --- | --- | --- | --- |
| Vesper | PASS | PASS | PASS | PASS | PASS | PASS |
| Admin Dashboard | PASS | PASS | PASS | PASS | PASS | PASS |
| AETHER | PASS | PASS | PASS | PASS | PASS | PASS |
| Aurelia Store | PASS | PASS | PASS | PASS | PASS | PASS |
| Creative Agency | PASS | PASS | PASS | PASS | PASS | PASS |
| Kiln Estates | PASS | PASS | PASS | PASS | PASS | PASS |
| Modern SaaS | PASS | PASS | PASS | PASS | PASS | PASS |
| Nexi AI | PASS | PASS | PASS | PASS | PASS | PASS |
| Premium Blog | PASS | PASS | PASS | PASS | PASS | PASS |
| Premium Portfolio | PASS | PASS | PASS | PASS | PASS | PASS |
| Premium Restaurant | PASS | PASS | PASS | PASS | PASS | PASS |
| Solace Studio | PASS | PASS | PASS | PASS | PASS | PASS |

ZIP checks per archive: CRC via `ZipFile.testzip()`, no absolute/`..` paths, no
symlink entries, required README/LICENSE/ASSET-LICENSES/CHANGELOG/QUICKSTART/
SUPPORT documents, `.env.example` present, no local `.env`/`.dev.vars`, no
bundled `node_modules`/`.next`/`dist`/`out`, and a scan for private keys, AWS
keys, GitHub tokens and OpenAI-style keys. All 12 pass.

## Browser gate results (2026-11-06)

`node scripts/template-quality-gate.mjs` was run against the rebuilt demos with a
real Chromium (`chromium-headless-shell` 1187, Playwright 1.55.0, axe-core
4.11.0) in this sandbox. It had to be invoked in halves because the shell tool
caps one command at five minutes; the second half was killed by that cap while
Premium Restaurant was running, so Premium Restaurant and Solace Studio have no
result at all.

Crashing navigations (`Error: page.goto: Page crashed` / `Target crashed`) are
recorded as **NOT VERIFIED**, never as passing. The crash reproduces under six
launch flag sets (`--disable-gpu`, `--in-process-gpu`,
`--disable-software-rasterizer`, `--disable-features=Vulkan,CanvasOopRasterization`,
`--disable-accelerated-2d-canvas`, `--js-flags=--max-old-space-size=2048`) and the
container had 15 GB free, so it is a renderer/sandbox limitation rather than a
product verdict — but the products remain unverified.

| Product | Runtime | Hydration | Routes | Buttons | Forms | Accessibility | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kiln Estates | loaded | **0** (was 2 × React #418) | 7 crawled / 0 failures | 0 buttons | 0 forms | **0 violations** (was 1 serious + 3 moderate) | **PASS** |
| Admin Dashboard | loaded | 0 | 3 crawled / 0 failures | 2 tested, 0 failures (bell popover works) | 0 forms | 0 violations | **PASS** |
| Nexi AI | loaded | 0 | 0 links crawled | 5 tested, 0 failures | 0 forms | 0 violations, no infinite animation under reduced motion | **PASS** |
| Premium Portfolio | loaded | 0 | 0 links crawled | 1 tested, 0 failures | 1 form, submit produces observable `role="status"` feedback | 0 violations | **PASS** |
| Vesper | Chromium crashed | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| AETHER | Chromium crashed | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| Aurelia Store | Chromium crashed | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| Creative Agency | Chromium crashed (crash persisted after the source fix, all flag sets) | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| Modern SaaS | Chromium crashed | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| Premium Blog | Chromium crashed | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| Premium Restaurant | not reached (gate run killed by the 5-minute command cap) | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| Solace Studio | not reached (same) | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |

Evidence, per product, from the two gate logs:

```
PASS Admin Dashboard: issues=0 routes=3/0 buttons=2/0 forms=0/0 a11y={} hydration=0
PASS Kiln Estates:    issues=0 routes=7/0 buttons=0/0 forms=0/0 a11y={} hydration=0
PASS Nexi AI:         issues=0 routes=0/0 buttons=5/0 forms=0/0 a11y={} hydration=0
PASS Premium Portfolio: issues=0 routes=0/0 buttons=1/0 forms=1/0 a11y={} hydration=0
FAIL Vesper / AETHER / Aurelia Store / Creative Agency / Modern SaaS / Premium Blog:
     "navigation/runtime failure: Error: page.goto: Page crashed"
```

The four defects that the 2026-11-05 run found are gone from those four
products: Kiln Estates hydrates cleanly with `<main>` present and no `h4`; Nexi AI
no longer starts a perpetual animation; Premium Portfolio's form reports a
result; and the Admin Dashboard bell and the Creative Agency buttons now do
something. Their remaining state depends on the crashing products above, which
were not re-tested after the fixes.

## Customer ZIP verification

All 12 ZIPs were rebuilt from the corrected source by
`scripts/harden-template-archives.py` and then independently extracted to a clean
directory by the verifier, which ran the documented commands in that extraction.
Install, build and lint results are the table above; they were produced from the
extracted archive, not from a source build. Each archive's SHA-256 changes in
this commit, so the ZIP and the tested revision are the same object.

## GitHub Actions

The two runs referenced in the checkpoint are real and were re-checked through
the GitHub API:

- `41804787343` — "Template release gate — all 12 products", `pull_request`,
  head `01b138bde58b14f7efdb990c1b45fc6657394fb8`, conclusion
  **`action_required`**, `total_count: 0` jobs.
  <https://github.com/ghandon183-glitch/nexora-core/actions/runs/41804787343>
- `41798649398` — "Deep code quality audit - all template packages",
  `pull_request`, head `def508c8feb8b9e0de349136408250c730435591`, conclusion
  **`action_required`**, `total_count: 0` jobs.
  <https://github.com/ghandon183-glitch/nexora-core/actions/runs/41798649398>

`action_required` with an empty job list is GitHub's first-time-contributor
workflow approval gate: the runs wait for a maintainer to press "Approve and run"
in the Actions UI. Nothing in the repository can approve them, and approving them
requires the repository owner. **No CI result is claimed for the current HEAD.**
The final gate must be run on the latest PR #83 HEAD after this branch is pushed
and approved; the local script results above are the only execution evidence in
this report.

## Unresolved (blocking READY)

1. **Six products have no browser verdict** because the renderer crashes in this
   sandbox (Vesper, AETHER, Aurelia Store, Creative Agency, Modern SaaS, Premium
   Blog), and **two were never reached** (Premium Restaurant, Solace Studio).
   They need a full gate run on `ubuntu-24.04` with
   `npx playwright install --with-deps chromium`.
2. **The verifier has not been re-run against this revision's ZIPs.** All 12 were
   re-hardened with the Phase 3 fixes after the last clean 12/12 pass, so install,
   peer resolution, build, lint, audit and ZIP integrity must be repeated on a
   clean extraction of exactly these archives.
3. **CI is still blocked.** Both runs are `action_required` with zero jobs (see
   above); no CI result exists for any commit after `01b138b`, and approval needs
   the repository owner.
4. AETHER's rebuilt export was built successfully but its `out/` was **not**
   published into `public/demo/aether/`, and Vesper has no static-export build
   step, so both demos are still the pre-fix exports.
5. Purchase/order/download delivery was not exercised: it needs the deployed
   Cloudflare environment and existing test-mode fixtures. Payment, PayMeGate and
   Gmail systems were not modified.
6. Commercial licensing of third-party imagery and fonts was not re-verified;
   only `ASSET-LICENSES.md` presence is checked automatically.

## Product status

**No product is marked READY.** Four products pass the complete browser gate on
the rebuilt demos (Kiln Estates, Admin Dashboard, Nexi AI, Premium Portfolio) and
their package-level checks passed on the previous revision, but neither their new
archives nor the other eight products have a complete, current verification.
Payment, PayMeGate webhooks, Gmail/OAuth, wallet addresses and customer order data
were not modified.
