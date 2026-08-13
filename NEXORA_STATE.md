# NEXORA — Persistent Project State Checkpoint

> Authoritative resume state for the NEXORA project.
> This file is the persistent memory across sessions. Read this FIRST.
> Do NOT re-scan or re-audit completed work. Do NOT start Task 11 without explicit instruction.

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
- No `download_logs` table currently exists; `orders.download_token` is the download credential.
- `CLAUDE.md` references a non-existent `AGENTS.md` (non-blocking, cosmetic).

---

## PRODUCTION READINESS

After Task 10, **Release 1.1 is production-ready CONDITIONAL on**:
1. the Cloudflare/GitHub secrets above being configured, and
2. the D1 migrations being applied to the remote database, and
3. the wallet addresses being verified as the intended production wallets.

---

## NEXT TASK

**Task 11 — TBD**

> DO NOT START TASK 11.
> WAIT FOR EXPLICIT USER INSTRUCTION.

---

## FAST RESUME PROTOCOL

On future sessions, FIRST read only:

1. `NEXORA_STATE.md`
2. `NEXORA_AGENT.md`

Do NOT:
- Perform a full repository scan.
- Re-audit completed Tasks (1–8, 10).
- Inspect unrelated source files.
- Inspect `nexora-payment-system-update.zip` unless explicitly instructed.

Use the checkpoint files as the authoritative resume state.

> Note on checkpoint accuracy: an earlier checkpoint over-stated the project state
> (claimed Task 9/License system complete, 8 migrations, R2, 118 routes, lint PASS).
> Task 10 corrected these against the actual repo. Trust the Task 10 findings above.

