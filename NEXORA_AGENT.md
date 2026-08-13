# NEXORA — Agent Resume Checkpoint

> Authoritative agent instructions for the NEXORA project.
> This file is the persistent agent memory across sessions. Read this FIRST.
> Do NOT re-scan or re-audit completed work. Do NOT start Task 10 without explicit instruction.

---

## PROJECT

**NEXORA** — Next.js Premium Template Marketplace / Digital Template Marketplace

---

## CURRENT RELEASE

**Release 1.1**

---

## AGENT SCOPE

This agent session continues the NEXORA project. The project's authoritative resume
state is maintained in two persistent checkpoint files at the repository root:

1. `NEXORA_STATE.md` — project state, completed tasks, verification, production requirements
2. `NEXORA_AGENT.md` — agent operating instructions, resume protocol, boundaries (this file)

---

## COMPLETED TASKS

Tasks 1–8 and Task 10 are COMPLETE. Release 1.1 is production-ready CONDITIONAL on
production configuration/secrets, D1 migrations, and wallet-address verification.

| Task | Status | Notes |
|------|--------|-------|
| Task 1  | COMPLETE | — |
| Task 2  | COMPLETE | — |
| Task 3  | COMPLETE | — |
| Task 4  | COMPLETE | — |
| Task 5  | COMPLETE | — |
| Task 6  | COMPLETE | — |
| Task 7  | COMPLETE | Customer Order Details — lint PASS, build PASS |
| Task 8  | COMPLETE | Admin Order Management & Revenue Dashboard — lint PASS, build PASS |
| Task 9  | NOT PRESENT IN REPO | License Key System claimed by earlier checkpoint but not in codebase — see NEXORA_STATE.md |
| Task 10 | COMPLETE + VERIFIED | Production Deployment Prep & Launch Hardening — lint PASS, build PASS (29 routes) |

Full detail for Tasks 7, 9, and 10 is in `NEXORA_STATE.md`.

> The earlier checkpoint over-stated state (Task 9 complete, 8 migrations, R2, 118 routes).
> Task 10 corrected these against the actual repository. Trust the Task 10 findings.

---

## CURRENT VERIFICATION (Release 1.1, post-Task 10)

- `npm run lint`: **PASS** — 0 errors, 0 warnings
- `npm run build`: **PASS** — 29 routes compiled
- `check-payments.yml` workflow: valid YAML
- No Cloudflare deploy performed (deferred to a separate manual step)

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

### Do NOT
- Perform a full repository scan.
- Re-audit completed Tasks (1–8, 10).
- Inspect unrelated source files (`app/`, `lib/`, `components/`, `migrations/`).
- Inspect `nexora-payment-system-update.zip` unless explicitly instructed.
- Run `npm install`, `npm run lint`, `npm run build`, or tests unless instructed.
- Start Task 11 without explicit user instruction.
- Modify any files unless explicitly instructed.

### DO
- Treat the checkpoint files as the authoritative resume state.
- Report the current release, completed tasks, current project status, and exact next
  task/resume point before taking any further action.
- Wait for explicit user instruction before proceeding.

---

## PRODUCTION DEPLOYMENT REMINDERS

Before deployment, the following must be completed (verified in Task 10 — see
`NEXORA_STATE.md` for full detail):

**Cloudflare Worker secrets/variables:**
- `ADMIN_PASSWORD` (required), `CRON_SECRET` (required), `RESEND_API_KEY`,
  `NOTIFY_EMAIL`, `SITE_URL`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`,
  optional `TRONGRID_API_KEY`

**GitHub Actions secrets:**
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CRON_SECRET`, `SITE_URL`

**Infrastructure:**
- D1 database created + migrations `0001`/`0002` applied to remote
- Template files in `public/downloads/*.zip` (static assets; **no R2 bucket required**)
- OG image present (`public/og-image.jpg`)
- Verify wallet addresses in `lib/orders/pricing.ts` are the intended production wallets

> Removed (phantom, unused by code): `AUTH_SECRET`, `LICENSE_SECRET`.

See `NEXORA_STATE.md` for known audit items and full production requirements.

