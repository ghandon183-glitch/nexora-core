# Nexora Core

Nexora Core is a Next.js project deployed to Cloudflare Workers via OpenNext for Cloudflare.

## Getting Started

Install dependencies and run the local development server with `npm install` and `npm run dev`.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs `npm run cf:deploy`.

## Production configuration

Configure Worker secrets in Cloudflare Workers & Pages → `nexora-core` → Settings → Variables. Keep credentials as secrets and never commit them. GitHub Actions requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Payments and email

Automated crypto payment verification is documented in `docs/PAYMENT_VERIFICATION.md`. The scheduled job calls `/api/cron/check-payments` every five minutes, protected by `CRON_SECRET`.

### Customer emails without buying a domain

Customer-facing email uses Gmail API over HTTPS because Cloudflare Workers cannot reliably send mail using raw SMTP. This path does not require a custom domain or paid email provider, but it does require Google OAuth credentials:

- `GMAIL_USER`: the Gmail account Nexora sends from.
- `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET`: OAuth 2.0 client credentials from Google Cloud Console.
- `GMAIL_REFRESH_TOKEN`: a refresh token granted the Gmail API `gmail.send` scope.

Enable the Gmail API for the Google Cloud project, configure OAuth consent, authorize the sending Gmail account, and store these values as Cloudflare Worker secrets. Never paste secrets into chat or commit them to Git. Important: Google's OAuth documentation says refresh tokens issued while an external OAuth app is in Testing expire after 7 days for Gmail scopes. Do not treat Testing mode as a durable production setup. Review the publishing/verification requirements and set the app to In production when appropriate; Google may show an unverified-app warning or require verification for the sensitive gmail.send scope. See the official [Gmail API sending guide](https://developers.google.com/workspace/gmail/api/guides/sending) and [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2).

### Owner notifications

Resend's onboarding test sender is only suitable for testing to the Resend account owner's own address. Sending from a branded address to arbitrary customers requires a verified domain, so do not treat Resend test-mode delivery as production customer email. Until a domain is affordable, keep customer email on the Gmail API path and verify owner notifications separately.

Set `SITE_URL` to the current public production URL. Other payment-provider settings are listed in `.env.example`.
