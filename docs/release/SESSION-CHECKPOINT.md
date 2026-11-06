# Session checkpoint — Nexora Core release (PR #83)

_Updated 2026-11-06. Branch `fix/p0-nexi-ai-product-readiness` (local branch name
`integration/release-pr83`). Nothing here is merged or deployed._

## Last completed product: Nexi AI

| Item | Value |
| --- | --- |
| Final commit for Nexi AI | `5730846fdc328ca509e3bf9327c38b9db5fd83ad` |
| ZIP | `public/downloads/nexi-ai.zip` |
| ZIP SHA-256 | `c90a5633186b6daf652dab58793d8e0e97a850b1e08b52789f7e914e11c26ba4` |
| ZIP size / entries | 82,619 bytes / 32 |

Evidence, all produced on a clean extraction of exactly that archive:

- `npm ci` → exit 0
- `npm run build` → exit 0
- `npx tsc --noEmit` → exit 0
- `npm run lint` (eslint) → exit 0
- `STATIC_EXPORT=true npm run build` → exit 0, writes `out/` with basePath `/demo/nexi-ai`
- Browser gate on the demo rebuilt from that archive → **PASS**, `issues=0`:
  25 links / 0 issues, 5 buttons / 0 failures, axe violations `[]`,
  hydration 0, console errors 0, page errors 0, failed requests 0, broken
  images 0, no overflow at 320/375/390/768/1024/1440/1920 px,
  `reducedMotion: {mediaMatches: true, infiniteAnimations: 0}`
- Keyboard pass (desktop 1440 px, Playwright): 31 focusables in a complete Tab
  order, focus leaves the document at the end (no focus trap), Enter and Space
  both toggle the FAQ accordion (`aria-expanded` true→false→true), `#product`
  and `#pricing` land at `top=0`, `#contact` reaches the document's maximum
  scroll with the section inside the viewport. A `:focus-visible` ring
  (2 px `#7dd3fc`, 2 px offset) now ships in `app/globals.css`; before the fix
  the browser default outline resolved to near-black on the dark hero.
- Docs in the shipped ZIP now match the code: Node.js >= 20.9, `npm ci`,
  `npm run dev|lint|build|start`, `STATIC_EXPORT=true npm run build` → `out/`
  with basePath `/demo/nexi-ai`. The README no longer claims `next/font/google`.

## NOT VERIFIED

1. **CI status.** No workflow result has been read for any commit after
   `01b138b`: the GitHub API is rate-limited from this environment and `gh` is
   not authenticated. Do not record CI as passing.
2. **Keyboard navigation on mobile widths.** The keyboard pass ran at 1440 px
   only.
3. Mobile/desktop rendering is covered by the gate's overflow checks, not by a
   visual review.

## State of the other products

Verified end to end in this phase (ZIP + install/build/lint + demo + browser):

- **Kiln Estates** — full pass, gate on the rebuilt demo reports `issues=0`,
  7 routes / 0 failures, hydration 0, no axe violations.
- **Vesper** — ZIP verified (`npm ci`, build, `tsc --noEmit` clean), honest
  `.env.example`, demo rebuilt with `vite build --base=./` and served 200;
  browser verdict still NOT VERIFIED (renderer crash in this sandbox).
- **Admin Dashboard**, **Premium Portfolio** — browser gate PASS earlier in the
  session on rebuilt demos; their archives were not re-verified after the last
  re-harden.

Still unverified in the browser (Chromium renderer crash in this sandbox — not a
product verdict, never recorded as passing): **AETHER**, **Aurelia Store**,
**Creative Agency**, **Modern SaaS**, **Premium Blog**. Never reached at all:
**Premium Restaurant**, **Solace Studio**.

AETHER's archive itself is healthy: it was rebuilt through the canonical
hardener after the duplicated `sharedPointer` patch in
`repair-shipped-template-archives.yml` was removed, and `npm ci`,
`npm run build`, `npx tsc --noEmit` and `npm run lint` all pass on it.

## Next work: AETHER

Start by reading the CI status and the existing evidence; do not re-run tests
that already passed on an unchanged artifact:

1. Read the workflow results for the current branch head (needs an authenticated
   `gh` or a token) and record the actual conclusions.
2. Try the browser gate for AETHER alone; it is the last product whose demo has
   never loaded here (`public/demo/aether/` is still the pre-fix export — a
   rebuilt `out/` exists in the build directory but was never published).
3. Then the remaining products, in this order: Aurelia Store, Creative Agency,
   Modern SaaS, Premium Blog, Premium Restaurant, Solace Studio.
4. Finally re-run `scripts/verify-template-packages.py` for all 12 archives,
   because the last complete 12/12 pass predates the current ZIPs, and update
   `docs/RELEASE_READINESS.md` with the results.

## Release state

- PR #83 is open and **not merged**. No site deployment has been performed.
- PR #84 (`def508c8feb8b9e0de349136408250c730435591`) is untouched and only kept
  as reference.
- Payment settings, PayMeGate webhooks, Gmail/OAuth, Cloudflare configuration,
  wallet addresses and customer order data were not modified.
- No product is READY: four have complete browser evidence, but the archive
  verifier has not been re-run for the current ZIPs and CI has no readable
  result.
