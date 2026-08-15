# NEXORA — Persistent Project State Checkpoint

> Authoritative resume state for the NEXORA project.
> This file is the persistent memory across sessions. Read this FIRST.
> Do NOT re-scan or re-audit completed work. Do NOT start Task 13 without explicit instruction.

---

## PROJECT

**NEXORA** — Next.js Premium Template Marketplace / Digital Template Marketplace

---

## CURRENT RELEASE

**Release 1.1**

---

## COMPLETED TASKS

| Task | Status |
|------|--------|
| Task 1  | COMPLETE |
| Task 2  | COMPLETE |
| Task 3  | COMPLETE |
| Task 4  | COMPLETE |
| Task 5  | COMPLETE |
| Task 6  | COMPLETE |
| Task 7  | COMPLETE |
| Task 8  | COMPLETE |
| Task 9  | **NOT PRESENT IN REPO** (see Task 10 audit note) |
| Task 10 | COMPLETE + VERIFIED |
| Task 11 | COMPLETE (commit 70f1d62 - Cloudflare context for production secrets) |
| Task 12 | COMPLETE + VERIFIED |
| Task 13 | COMPLETE + VERIFIED |
| Task 14 | COMPLETE (audit only — no code changes) |
| Task 15 | COMPLETE (not yet committed/pushed) |


---

## TASK DETAIL — COMPLETED

### Task 7 — Customer Order Details
- Customer order detail API
- Ownership authorization
- Secure download handling preserved
- lint PASS
- build PASS

### Task 8 — Admin Order Management & Revenue Dashboard
- Admin order search
- Status filtering
- Pagination
- Admin order details
- Revenue/order metrics
- Server-side canonical pricing
- Parameterized D1 queries
- Admin authentication preserved
- lint PASS
- build PASS

### Task 9 — License Key System
**STATUS: NOT PRESENT IN REPOSITORY (Task 10 audit finding).**

A previous checkpoint claimed Task 9 was COMPLETE with a license database migration,
license generation, AES-256-GCM encrypted storage, and a `LICENSE_SECRET` env var.
The Task 10 deployment audit found NONE of this exists in the actual codebase:
- No `licenses`/`license_keys` table; only `migrations/0001_orders.sql` and
  `migrations/0002_email_verifications.sql` exist.
- No license-generation or license-retrieval library code.
- `LICENSE_SECRET` is referenced ONLY in this checkpoint file; it is not used by any code.
- `AUTH_SECRET` is likewise referenced only in the checkpoint and is not used by any code.

Both `LICENSE_SECRET` and `AUTH_SECRET` are therefore **phantom requirements** and have
been removed from the production requirements below. If a license system is genuinely
desired, it is a future feature task (not part of Release 1.1 as it stands).

### Task 10 — Production Deployment Preparation & Final Launch Hardening
**STATUS: COMPLETE + VERIFIED.**

Deployment audit + hardening of Release 1.1 for Cloudflare production.

#### Deployment blockers found & fixed
1. **Missing payment-check cron workflow (BLOCKER).** `docs/PAYMENT_VERIFICATION.md`
   documented a GitHub Actions job (`check-payments.yml`) running every 5 minutes to call
   `/api/cron/check-payments`, but the workflow file did NOT exist in `.github/workflows/`
   (only `deploy.yml` was present). Without it, pending crypto orders would never be
   auto-confirmed. The cron route itself was correct and protected by `CRON_SECRET`.
   **Fix:** added `.github/workflows/check-payments.yml` (every 5 min + manual dispatch),
   POSTing to `${SITE_URL}/api/cron/check-payments` with the `x-cron-secret` header.
2. **`.env.example` incomplete (BLOCKER).** It documented only `RESEND_API_KEY`,
   `NOTIFY_EMAIL`, `GMAIL_*`, `SITE_URL` but was missing `ADMIN_PASSWORD` and
   `CRON_SECRET`, which the code requires (`lib/admin/auth.ts`, `app/api/cron/check-payments`).
   Also added the optional `TRONGRID_API_KEY`.
   **Fix:** rewrote `.env.example` with grouped sections documenting every var the code
   actually uses. `AUTH_SECRET`/`LICENSE_SECRET` intentionally NOT added (unused by code).
3. **Lint failure in checkout (BLOCKER).** `app/[locale]/checkout/[slug]/page.tsx` had a
   `react-hooks/set-state-in-effect` error (`setEmailInput(user.email)` inside `useEffect`),
   so `npm run lint` failed with 1 error (the prior checkpoint's "lint PASS" was inaccurate).
   **Fix:** initialize `emailInput` state from `user?.email ?? ""` and removed the effect.
   Behaviour preserved (editable field; re-verified at checkout).

#### Documentation gaps fixed
4. **README.md had stale "Deploy on Vercel" boilerplate** (misleading for a Cloudflare
   Workers/OpenNext app). Replaced with an accurate Cloudflare deploy section
   (D1 creation, migrations, Worker secrets, GitHub Actions secrets, static downloads).
   (Note: `docs/PAYMENT_VERIFICATION.md` is the detailed payment-setup guide, in Persian.)
5. **`CLAUDE.md` is `@AGENTS.md` but `AGENTS.md` does not exist** — minor broken import,
   left as-is (non-blocking; does not affect deployment).

#### Repository reality (corrects earlier checkpoint inaccuracies)
- Only **2 migrations** exist (`0001_orders.sql`, `0002_email_verifications.sql`), not 0001–0008.
- **No R2 binding and no R2 usage anywhere.** Template packages are served as **static
  assets** from `public/downloads/*.zip` (7 zips present, matching `lib/data/downloads.ts`).
  No R2 bucket is required for deployment. `wrangler.jsonc` has only the `ORDERS_DB` D1
  binding + the OpenNext `ASSETS` binding.
- Build compiles **29 routes** (not 118).
- `wrangler.jsonc` already contains a real `database_id` for `nexora-orders`.
- Wallet addresses in `lib/orders/pricing.ts` are real-looking mainnet addresses (USDT TRC20 + BTC);
  `docs/PAYMENT_VERIFICATION.md` calls them placeholders — owner MUST verify they are the
  intended production wallets before accepting real payments.

#### Files modified (Task 10)
- `app/[locale]/checkout/[slug]/page.tsx` — fixed `setState`-in-effect lint error.
- `.env.example` — added `ADMIN_PASSWORD`, `CRON_SECRET`, `TRONGRID_API_KEY`; regrouped.
- `.github/workflows/check-payments.yml` — NEW; missing scheduled payment-check job.
- `README.md` — replaced stale Vercel deploy section with Cloudflare instructions.

#### Verification (Task 10)
- `npm run lint`: **PASS** — 0 errors, 0 warnings
- `npm run build`: **PASS** — 29 routes compiled
- `check-payments.yml`: YAML valid (js-yaml parse OK)
- No Cloudflare deploy performed (deferred to separate manual step, per instruction).

---

## TASK 11 — Cloudflare context for production secrets

**STATUS: COMPLETE (commit 70f1d62).**

Introduced `lib/env.ts` with a centralized `getEnv()` helper that reads the
Worker's Cloudflare context (`getCloudflareContext({ async: true })`) first and
falls back to `process.env` for local dev. Applied to the API routes and
`lib/admin/auth.ts` for `ADMIN_PASSWORD`, `CRON_SECRET`, `RESEND_API_KEY`,
`NOTIFY_EMAIL`, `SITE_URL`, `TRONGRID_API_KEY`. See commit 70f1d62.

---

## TASK 12 — Complete the Cloudflare production-secrets refactor

**STATUS: COMPLETE + VERIFIED.**

Finished the env centralization started in Task 11 so ALL secrets/vars the
code reads flow through the single allow-listed `getEnv()` helper.

### What was done
1. `lib/env.ts` — added `GMAIL_USER` and `GMAIL_APP_PASSWORD` to the
   `CloudflareEnv` interface and the `CF_ENV_KEYS` allow-list. Existing
   Cloudflare-first / process.env fallback behavior preserved.
2. `lib/mailer.ts` — removed the duplicated direct
   `getCloudflareContext()` call and the local `cfEnv` cast; now imports and
   uses the centralized `getEnv()` from `lib/env.ts`. Behavior when
   credentials are missing is unchanged (returns `{ sent: false }`, never
   throws). No secrets are logged. Email behavior otherwise unchanged.
3. `app/sitemap.ts` — removed module-scope `process.env.SITE_URL`;
   resolves `SITE_URL` through `getEnv()` with the workers.dev URL as
   fallback. `sitemap()` is now `async`. All existing entries preserved
   (static paths + per-template + locale alternates).
4. `app/robots.ts` — removed module-scope `process.env.SITE_URL`;
   resolves `SITE_URL` through `getEnv()` with the workers.dev fallback.
   `robots()` is now `async`. Robots behavior preserved.
5. `app/[locale]/layout.tsx` — removed module-scope `process.env.SITE_URL`;
   converted static `export const metadata` to an `async generateMetadata()`
   that resolves `SITE_URL` through `getEnv()` (workers.dev fallback).
   All title / description / OpenGraph / Twitter / robots fields preserved;
   only the URL origin resolution changed.

### Files modified (Task 12)
- `lib/env.ts`
- `lib/mailer.ts`
- `app/sitemap.ts`
- `app/robots.ts`
- `app/[locale]/layout.tsx`
- `NEXORA_STATE.md` / `NEXORA_AGENT.md` (this update)

### Verification (Task 12)
- `npm run lint`: **PASS** — 0 errors, 0 warnings
- `npm run build`: **PASS** — 29 routes compiled (same as before)
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` confirmed centralized in `getEnv()`.
- `lib/mailer.ts` confirmed to no longer call `getCloudflareContext()`.
- No client component imports `lib/env.ts` (all importers are server-only:
  API routes, `lib/admin/auth.ts`, `lib/orders/verify.ts`, `lib/mailer.ts`,
  and the `sitemap`/`robots`/layout metadata files; none carry `'use client'`).
- `sitemap.ts` / `robots.ts` / `layout.tsx` confirmed free of module-scope
  `process.env.SITE_URL`.
- Admin authentication (`lib/admin/auth.ts`) unchanged and intact.
- No unrelated files modified.

---

## TASK 13 — Gate paid template downloads behind the order `download_token`

**STATUS: COMPLETE + VERIFIED.**

### Problem solved
The `download_token` previously gated only the download *page UI*, not the
actual file. Paid template ZIPs lived as static assets at hardcoded, guessable
public URLs (`/downloads/<slug>.zip`) and were linked directly from the
download page and the dashboard. The slug list is public (templates page /
sitemap), so anyone could download paid products for free without a token.

### Design
- New token-authorized endpoint `app/api/download/[token]/route.ts` is now the
  sole delivery mechanism for paid ZIPs. It:
  1. Reads the token from the URL.
  2. Looks up the order via the existing parameterized `getOrderByToken()`.
  3. Denies invalid / empty tokens (generic 404, no order info leaked).
  4. Denies nonexistent orders (generic 404).
  5. Denies orders whose status is not `confirmed` (generic 404 — no state leak).
  6. Resolves the purchased template slug to its asset path via
     `getDownloadAssetPath(slug)` — token A can only ever resolve to its own
     order's template (cross-order access impossible by construction).
  7. Streams the ZIP through the Cloudflare `ASSETS` binding
     (`env.ASSETS.fetch(assetPath)`) — the same mechanism OpenNext itself uses
     to serve static assets — with `Content-Type: application/zip` and
     `Content-Disposition: attachment; filename="<slug>.zip"`.
  8. Streams (never buffers) the body, so the ~13.7 MB largest package is
     served within Worker limits.

### How direct public ZIP access was eliminated
- `wrangler.jsonc`: added `assets.run_worker_first: ["/downloads/*"]` so
  Cloudflare routes direct `/downloads/*` requests through the Worker
  (default behavior bypasses the Worker for static assets, serving them with
  no auth). Other static assets continue to bypass the Worker for performance.
- `middleware.ts`: added a deny rule — any request whose pathname starts with
  `/downloads/` returns a 404 — and extended the matcher to include
  `/downloads/:path*` (the dotted-path lookahead previously excluded `.zip`
  files). Because the Worker runs middleware before the asset resolver, a
  direct `/downloads/<slug>.zip` request is denied before the file can be
  served. The token endpoint's internal `ASSETS.fetch` call is a binding
  subrequest, NOT a public HTTP request, so it is unaffected by this deny.

### Cloudflare / 13.7 MB feasibility
Verified empirically via `npm run cf:build`:
- `public/downloads/*.zip` (incl. 13.7 MB `solace-studio.zip`) are copied to
  `.open-next/assets/downloads/` and served as platform static assets via the
  `ASSETS` binding.
- The Worker bundle (`worker.js`) is ~2 KB — it does NOT embed the ZIPs, so
  there is no Worker-size/bundling issue. Files are streamed by the platform.
- `run_worker_first: ["/downloads/*"]` is correctly compiled into
  `.open-next/cloudflare/init.js` as
  `define_ASSETS_RUN_WORKER_FIRST_default = ["/downloads/*"]`.
- No R2 introduced and none required.

### Files created/modified (Task 13)
- `app/api/download/[token]/route.ts` — NEW; token-authorized download endpoint.
- `lib/data/downloads.ts` — added `getDownloadAssetPath(slug)` server helper;
  documented that `DOWNLOADS` paths are internal-only (never rendered as href).
- `app/[locale]/download/[token]/page.tsx` — links to `/api/download/[token]`
  instead of the public `/downloads/<slug>.zip` URL.
- `app/[locale]/dashboard/page.tsx` — links to `/api/download/[token]` when a
  token is present; legacy purchases without a token show "use your email link".
- `lib/context/purchases-context.tsx` — added optional `downloadToken` to
  `Purchase` (backward-compatible).
- `app/[locale]/checkout/[slug]/page.tsx` — persists the `downloadToken`
  returned by the status API into the purchase record (download-auth data only;
  payment/verification/pricing logic unchanged).
- `middleware.ts` — denies direct `/downloads/*` access (404); matcher updated.
- `wrangler.jsonc` — `assets.run_worker_first: ["/downloads/*"]`.
- `eslint.config.mjs` — ignore `.open-next/**` build output (generated, like
  `.next/**`; surfaced by running `cf:build` for verification).

### Verification (Task 13)
- `npm run lint`: **PASS** — 0 errors, 0 warnings.
- `npm run build`: **PASS** — 29 routes + new `/api/download/[token]` route.
- `npm run cf:build`: **PASS** — Worker + assets bundled; `run_worker_first`
  compiled; ZIPs remain in `.open-next/assets/downloads/`.

Targeted static verification (runtime verification requires a deployed
Cloudflare environment — see "Remaining manual deployment requirements"):
- invalid/empty token → denied (guard at route line 37). ✓
- nonexistent order → denied (line 49). ✓
- unconfirmed order → denied (line 55). ✓
- valid confirmed token → streams correct slug's ZIP only (slug derived from
  the token's own order; cross-order impossible). ✓
- token A cannot fetch order B's file (per-token lookup + per-order slug). ✓
- no rendered `<a href="/downloads/...">` remains in `app/`/`components/`. ✓
- direct `/downloads/*` → middleware 404 (run_worker_first routes to Worker). ✓

### Remaining manual deployment requirements
- Deploy to Cloudflare (not done) and confirm at runtime that:
  (a) a direct `GET /downloads/<slug>.zip` returns 404, and
  (b) `GET /api/download/<valid-token>` streams the correct ZIP.
  These depend on Cloudflare platform behavior of `run_worker_first` +
  OpenNext's middleware-first dispatch (statically confirmed in `worker.js`,
  but not runtime-verified without deployment).
- Existing Cloudflare/GitHub secrets and D1 migrations from Task 10 still apply.
- No new secrets, no R2, no D1 migration required for Task 13.

### OUT OF SCOPE (Task 13)
- License keys (Task 9 — not present; future feature).
- R2 (not required by current architecture).
- Wallet addresses in `lib/orders/pricing.ts` (manual owner verification).
- Pricing, payment verification, authentication, admin auth, email system,
  rate limiting — all unchanged.
- Test framework — none added.

---

## TASK 15 — Production Payment & Cloudflare Launch Readiness

**STATUS: COMPLETE (not yet committed/pushed — deferred to owner review).**

Audit + one required launch fix for the production payment system. No
Cloudflare deployment performed. No wallet changes.

### Wallet clarification (AUTHORITATIVE)
The wallet addresses in `lib/orders/pricing.ts` are **REAL OWNER PRODUCTION
WALLETS**, not placeholders. An earlier audit/`docs/PAYMENT_VERIFICATION.md`
described them as placeholders — that statement is NOT applicable. They were
NOT changed, regenerated, or "corrected" in Task 15:
- USDT TRC20: `TTs2YMrifwWhiEPWVxhqqHd7v5DZNu477R` (unchanged)
- BTC: `bc1qky4uvdn0v9kyha9v9wns5893f62djd8ssa04u0` (unchanged)

### Payment flow audit (verified end-to-end)
Customer → template → `/checkout/${slug}` → email verification (6-digit code
via Gmail SMTP) → currency select (USDT/BTC) → `POST /api/orders/create`
(rate-limited, email-verification re-checked + marked used) →
`generatePayAmount` fingerprinted amount → `WALLETS[currency].address` stored
on order → buyer sends exact crypto → GitHub Actions cron every 5 min →
`POST /api/cron/check-payments` (CRON_SECRET protected) → `checkPayment()`:
USDT via TronGrid TRC20 API (exact-amount match), BTC via mempool.space
(confirmed txs, exact-satoshi match) → on match `markOrderConfirmed` +
randomUUID `download_token` → customer email (Gmail SMTP) with
`/download/${token}` → `/api/download/[token]` (Task 13 token-gated stream
via ASSETS binding). Flow is sound.

### Launch blocker found & fixed
**Price manipulation (BLOCKER).** `/api/orders/create` trusted the
client-supplied `basePriceUsd` from the request body. A tampered request
could set `basePriceUsd: 1` (instead of e.g. 49) and the server would
generate a fingerprinted amount for $1, store `base_price_usd: 1`, and the
on-chain match would succeed for $1 worth of crypto — yielding a confirmed
order + download for a fraction of the real price. The Task 8
"server-side canonical pricing" applied only to admin views, not order
creation.
**Fix:** `/api/orders/create` now resolves the canonical price from the
server-side template catalog via `getTemplate(slug).price` and ignores the
client-supplied `basePriceUsd` entirely (field removed from the request
interface + validation + order persistence; checkout client still sends it
harmlessly, ignored). Minimal change, no pricing values or wallets touched.

### Files modified (Task 15)
- `app/api/orders/create/route.ts` — server-side canonical price validation.

### Other issues found (NOT fixed — documented, not launch blockers)
- **Misleading timestamp-guard comment (NON-BLOCKING):** `lib/orders/verify.ts`
  USDT path comments that it ignores transactions created before the order,
  but no timestamp check is implemented (BTC path likewise). The fingerprint
  uniqueness makes practical exploitation astronomically unlikely; left as-is
  to avoid redesigning verification. Defense-in-depth future task.
- **`/api/notify-purchase` orphaned (NON-BLOCKING):** never called by the
  checkout flow (checkout polls `/api/orders/[id]/status` instead). Dead but
  harmless; left as-is.
- **In-memory rate limiting (NON-BLOCKING):** documented limitation; acceptable
  at launch, Redis recommended at scale.

### Verification (Task 15)
- `npm run lint`: **PASS** — 0 errors, 0 warnings.
- `npm run build`: **PASS** — 29 routes compiled.
- `npm run cf:build`: **PASS** — Worker + assets bundled.
- `git diff --check`: **PASS** — no whitespace errors.
- Wallet addresses: **UNCHANGED** (confirmed after builds).

### Manual production steps remaining (owner — DO NOT perform during audit)
See "Manual Production Checklist" in the Task 15 report. Owner must: set
Cloudflare Worker secrets, set GitHub Actions secrets, apply D1 migrations to
remote, set `SITE_URL`, set a strong matching `CRON_SECRET`, deploy, and
runtime-verify payment + secure-download flows.

---

## PRODUCTION CONFIGURATION DOCUMENTATION

**COMPLETE** (Task 10).

### .env.example
Documents every variable the code actually uses (see "PRODUCTION REQUIREMENTS" below).

---

## CURRENT VERIFICATION

- `npm run lint`: **PASS** — 0 errors, 0 warnings
- `npm run build`: **PASS** — 29 routes compiled
- (Prior "118 routes" figure was inaccurate; actual is 29.)

---

## PRODUCTION REQUIREMENTS

Before deployment, Cloudflare configuration/secrets must be completed
(these are the variables the code actually reads — verified in Task 10):

**Cloudflare Worker secrets/variables** (Workers → nexora-core → Settings → Variables):
- `ADMIN_PASSWORD` (required) — admin panel login; store as Secret
- `CRON_SECRET` (required) — authorizes `/api/cron/check-payments`; must match the GitHub Actions secret
- `RESEND_API_KEY` (required for owner email notifications)
- `NOTIFY_EMAIL` (required for owner email notifications)
- `SITE_URL` (required for email links, e.g. `https://nexora-core.nxora.workers.dev`, no trailing slash)
- `GMAIL_USER`, `GMAIL_APP_PASSWORD` (required for customer-facing email)
- `TRONGRID_API_KEY` (optional; higher USDT verification rate limits)

**GitHub Actions secrets** (Settings → Secrets and variables → Actions):
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (for `deploy.yml`)
- `CRON_SECRET`, `SITE_URL` (for `check-payments.yml`)

**Infrastructure:**
- D1 database `nexora-orders` created and `database_id` set in `wrangler.jsonc` (already present)
- Apply migrations to remote D1: `0001_orders.sql`, `0002_email_verifications.sql`
- Template files: `public/downloads/*.zip` (static assets; **no R2 bucket required**)
- OG image: `public/og-image.jpg` (present)

> Removed (phantom): `AUTH_SECRET` and `LICENSE_SECRET` were listed in an earlier
> checkpoint but are NOT used by any code — see Task 9 note.

---

## KNOWN AUDIT ITEMS

- In-memory rate limiting is acceptable for MVP but Redis/distributed rate limiting is recommended at scale.
- `ADMIN_PASSWORD` must be stored as a Cloudflare Secret in production.
- `CRON_SECRET` must be a strong value (e.g. `openssl rand -hex 32`) and identical in GitHub Actions and Cloudflare.
- `SITE_URL` must be configured correctly for production (used in email links).
- Wallet addresses in `lib/orders/pricing.ts` must be verified as the intended production
  wallets before accepting real payments (the docs describe them as placeholders).
- Paid template downloads are gated behind the order `download_token` via
  `/api/download/[token]` (Task 13); direct `/downloads/<slug>.zip` access is denied by
  `middleware.ts` + `wrangler.jsonc` `run_worker_first`. Runtime confirmation pending deploy.
- `CLAUDE.md` references a non-existent `AGENTS.md` (non-blocking, cosmetic).

---

## PRODUCTION READINESS

After Task 10, **Release 1.1 is production-ready CONDITIONAL on**:
1. the Cloudflare/GitHub secrets above being configured, and
2. the D1 migrations being applied to the remote database, and
3. the wallet addresses being verified as the intended production wallets.

After Task 13, paid downloads are token-gated; runtime confirmation of the
direct-access deny is pending deploy (see Task 13 "Remaining manual deployment
requirements").

---

## NEXT TASK

**Task 15 — COMPLETE (not yet committed/pushed)**

See "TASK 15" detail below. Wallet addresses confirmed as REAL OWNER PRODUCTION
WALLETS and left unchanged. One launch blocker fixed (server-side canonical price
validation in `/api/orders/create`). Working tree has one uncommitted change;
commit/push deferred to owner review.

**Task 16 — TBD**

> DO NOT START TASK 16.
> WAIT FOR EXPLICIT USER INSTRUCTION.

---

## FAST RESUME PROTOCOL

On future sessions, FIRST read only:

1. `NEXORA_STATE.md`
2. `NEXORA_AGENT.md`

Do NOT:
- Perform a full repository scan.
- Re-audit completed Tasks (1–8, 10, 11, 12, 13).
- Inspect unrelated source files.
- Inspect `nexora-payment-system-update.zip` unless explicitly instructed.

Use the checkpoint files as the authoritative resume state.

> Note on checkpoint accuracy: an earlier checkpoint over-stated the project state
> (claimed Task 9/License system complete, 8 migrations, R2, 118 routes, lint PASS).
> Task 10 corrected these against the actual repo. Trust the Task 10 findings above.

