This is a Next.js project deployed to Cloudflare Workers via OpenNext for Cloudflare, not Vercel.

## Getting Started

Install dependencies and run the local development server with `npm install` and `npm run dev`.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs `npm run cf:deploy`.

### Production configuration

In Cloudflare Workers & Pages → `nexora-core` → Settings → Variables, configure the required Worker secrets/variables, including `ADMIN_PASSWORD`, `CRON_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NOTIFY_EMAIL`, and the payment-provider secrets used by this deployment. Configure `SITE_URL` to the public production URL. GitHub Actions also requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

### Payments and email

Automated crypto payment verification is documented in `docs/PAYMENT_VERIFICATION.md`. The scheduled job calls `/api/cron/check-payments` every five minutes, protected by `CRON_SECRET`.

Owner notifications and customer-facing emails use the Resend HTTPS API. `RESEND_FROM_EMAIL` must be an address on a domain verified in Resend. Do not configure Gmail SMTP for Cloudflare Worker email delivery: raw SMTP connections are not a dependable Worker transport. Verify the domain before relying on customer purchase emails in production.
