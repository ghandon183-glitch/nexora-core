This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

Nexora deploys to **Cloudflare Workers** via [OpenNext for Cloudflare](https://opennext.js.org/cloudflare),
not Vercel. Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs
`npm run cf:deploy` (builds the Worker with `opennextjs-cloudflare` and deploys it).

### Before the first deploy

1. **Create the D1 database** and put its `database_id` into `wrangler.jsonc`
   (binding `ORDERS_DB`):
   ```bash
   npx wrangler d1 create nexora-orders
   ```
2. **Apply the migrations** to the remote D1:
   ```bash
   npx wrangler d1 execute nexora-orders --remote --file=./migrations/0001_orders.sql
   npx wrangler d1 execute nexora-orders --remote --file=./migrations/0002_email_verifications.sql
   ```
3. **Set Cloudflare Worker secrets** (Workers → nexora-core → Settings → Variables, as **Secrets**):
   `ADMIN_PASSWORD`, `CRON_SECRET`, `RESEND_API_KEY`, `NOTIFY_EMAIL`, `SITE_URL`,
   `GMAIL_USER`, `GMAIL_APP_PASSWORD` (optional `TRONGRID_API_KEY`).
   See `.env.example` for what each one does.
4. **GitHub Actions secrets** (Settings → Secrets and variables → Actions):
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, plus `CRON_SECRET` and `SITE_URL`
   for the scheduled payment-check workflow (`.github/workflows/check-payments.yml`).
5. **Template files** live in `public/downloads/*.zip` and are served as static
   assets — no R2 bucket is required.

### Payments & email

Automated crypto payment verification is documented in
[`docs/PAYMENT_VERIFICATION.md`](docs/PAYMENT_VERIFICATION.md). The scheduled job
calls `/api/cron/check-payments` every 5 minutes, protected by `CRON_SECRET`.
Owner notifications go through Resend; customer-facing emails go through Gmail SMTP.

For more on Next.js itself, see the [Next.js documentation](https://nextjs.org/docs).

