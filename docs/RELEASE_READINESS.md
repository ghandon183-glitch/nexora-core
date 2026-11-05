# Nexora Core — template release readiness

_Updated 2026-11-05. Every result below was produced by the scripts in this
repository, against the ZIPs and demos committed here. Nothing is inherited from
an earlier report._

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

## Package verification (ZIP → clean extract → documented install → build → lint → audit)

Produced by `python3 scripts/verify-template-packages.py` on the final tree.
`peer_resolution` proves the shipped manifest resolves **without**
`--legacy-peer-deps`.

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

## Browser gate results

`node scripts/template-quality-gate.mjs` was executed against the committed
demos with a real Chromium (`chromium-headless-shell` 1187, Playwright 1.55.0,
axe-core 4.11.0) in this sandbox. The run produced results for part of the
product list and then the browser binary began crashing the renderer on every
navigation (`Error: page.goto: Page crashed` / `Target crashed`), which is a
property of this container (no root, no GPU, system libraries supplied from a
user-space prefix), not a product verdict. Those products are recorded as
**NOT VERIFIED**, never as passing.

| Product | Runtime | Hydration | Routes | Buttons | Forms | Accessibility | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Vesper | Chromium crashed | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| Admin Dashboard | loaded | 0 | 3 / 0 failures | 2 tested, 1 no observable action ("Notifications") | 0 forms | 0 violations | FAIL |
| AETHER | Chromium crashed | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| Aurelia Store | Chromium crashed | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| Creative Agency | loaded, crashed mid-run | 0 until crash | 5 / 0 failures | 8 tested, 2 unlabelled with no observable action | 0 forms | not reached | FAIL |
| Kiln Estates | loaded | **2 × React #418** | 7 / 0 failures | 0 buttons | 0 forms | serious: 1 (color-contrast, 7 nodes); moderate: 3 (heading-order, landmark-one-main, region) | FAIL |
| Modern SaaS | Chromium crashed | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| Nexi AI | loaded | 0 | 0 links crawled | 5 tested, 0 failures | 0 forms | 3 infinite animations keep running under `prefers-reduced-motion` | FAIL |
| Premium Blog | Chromium crashed | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| Premium Portfolio | loaded | 0 | 0 links crawled | 1 tested, 0 failures | 1 form, no observable submit feedback | 0 violations | FAIL |
| Premium Restaurant | not reached | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |
| Solace Studio | not reached | not tested | not tested | not tested | not tested | not tested | NOT VERIFIED |

Defects found by the gate, with their cause:

- **Kiln Estates — React #418 (hydration).** The published export does not match
  the server-rendered markup. The demo is an older export than the hardened
  source, so this must be re-tested after rebuilding the demo from the current
  ZIP; it is not fixed until a rebuilt demo hydrates cleanly.
- **Kiln Estates — accessibility.** `color-contrast` on the clay-toned eyebrow
  text (7 nodes), `heading-order` (an `h4` after a lower level), missing
  `<main>` landmark and three sections outside any landmark. The hardener
  already rewrites the source equivalents; the committed demo predates those
  patches, which is why the browser still sees them.
- **Nexi AI — reduced motion.** Three CSS animations keep running with
  `prefers-reduced-motion: reduce`; no `@media (prefers-reduced-motion: reduce)`
  rule guards them.
- **Premium Portfolio — placeholder links and form feedback.** Three social
  links point at `https://example.com/studionorth`, and the newsletter form
  gives no observable submission feedback.
- **Admin Dashboard / Creative Agency — button affordances.** The notifications
  button and two icon-only buttons produce no observable state change on click;
  the icon-only ones also have no accessible name.

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

1. Browser verification is incomplete: 6 of 12 products could not be loaded at
   all in this sandbox before Chromium became unstable, and the 6 that loaded
   include 4 with real defects. All 12 still need a full gate run on
   `ubuntu-24.04` with `npx playwright install --with-deps chromium`.
2. The defects listed above (Kiln hydration/a11y, Nexi reduced motion, Portfolio
   links and form feedback, Admin Dashboard/Creative Agency button affordances)
   require source fixes in the affected templates plus a demo rebuild, then a
   re-run of the gate. Rebuilding the demos from the corrected ZIPs is the first
   step, because several findings are stale-export artefacts rather than current
   source defects.
3. Purchase/order/download delivery was not exercised: it needs the deployed
   Cloudflare environment and existing test-mode fixtures. Payment, PayMeGate and
   Gmail systems were not modified.
4. Commercial licensing of third-party imagery and fonts was not re-verified;
   only `ASSET-LICENSES.md` presence is checked automatically.

## Product status

**No product is marked READY.** Package-level checks (install, peer resolution,
build, lint, audit, ZIP integrity) pass for all 12. Every product still lacks a
complete, passing browser gate, and four have confirmed browser defects.
