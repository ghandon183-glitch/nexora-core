# راه‌اندازی سیستم تأیید خودکار پرداخت کریپتو

این سند مراحل لازم برای فعال‌سازی سیستم جدید سفارش‌ها روی زیرساخت واقعی Cloudflare رو توضیح می‌ده.

## ۱. ساخت دیتابیس D1

```bash
npx wrangler d1 create nexora-orders
```

خروجی این دستور یه `database_id` بهت می‌ده. اون رو کپی کن و جای `REPLACE_WITH_YOUR_D1_DATABASE_ID` تو فایل `wrangler.jsonc` بذار.

## ۲. اجرای مایگریشن (ساخت جدول orders)

```bash
npx wrangler d1 execute nexora-orders --remote --file=./migrations/0001_orders.sql
```

## ۳. اضافه‌کردن Secret ها به GitHub Actions

برو تو GitHub، بخش `Settings → Secrets and variables → Actions` و این‌ها رو اضافه کن:

| Secret | مقدار |
|---|---|
| `CRON_SECRET` | یه رشته‌ی تصادفی طولانی (مثلاً با `openssl rand -hex 32` بسازش) — همینو بعداً تو Cloudflare هم به‌عنوان env variable می‌ذاری |
| `SITE_URL` | آدرس کامل سایت، مثلاً `https://nexora-core.nxora.workers.dev` (بدون `/` در آخر) |

## ۴. اضافه‌کردن Environment Variables به Cloudflare Workers

تو داشبورد Cloudflare، بخش Workers → nexora-core → Settings → Variables، این‌ها رو اضافه کن (به‌صورت **Secret**، نه Plaintext):

| نام | مقدار |
|---|---|
| `CRON_SECRET` | همون مقداری که تو GitHub Secret گذاشتی |
| `ADMIN_PASSWORD` | رمز عبور پنل ادمین (`/admin`) — یه رمز قوی انتخاب کن |
| `SITE_URL` | همون آدرس سایت |
| `TRONGRID_API_KEY` | اختیاریه؛ بدون این هم کار می‌کنه ولی محدودیت نرخ درخواست کمتریه. رایگان از [tronscan/trongrid](https://www.trongrid.io) بگیر اگه رشد ترافیک زیاد شد |

## ۵. بررسی آدرس‌های ولت

تو فایل `lib/orders/pricing.ts`، آدرس‌های ولت USDT و BTC رو با آدرس‌های واقعی خودت جایگزین کن (الان یه نمونه‌ی placeholder گذاشته شده):

```ts
export const WALLETS = {
  USDT: { ..., address: "آدرس واقعی TRC20 خودت" },
  BTC: { ..., address: "آدرس واقعی بیت‌کوین خودت" },
};
```

## ۶. Push و دیپلوی

بعد از commit و push، GitHub Actions هم دیپلوی سایت رو انجام می‌ده هم خودکار workflow جدید (`check-payments.yml`) رو هر ۵ دقیقه اجرا می‌کنه.

## چطور تست کنم مطمئن بشم کار می‌کنه؟

۱. یه سفارش تستی از چک‌اوت بساز (مبلغ کوچیک واقعی بفرست، یا فقط بررسی کن آدرس/مبلغ درست نمایش داده می‌شه)
۲. برو `/admin`، با رمزی که گذاشتی وارد شو، سفارش رو تو لیست «pending» ببین
۳. اگه پرداخت واقعی نکردی و می‌خوای فقط تست کنی، از دکمه‌ی «Force confirm» تو پنل ادمین استفاده کن تا ایمیل و لینک دانلود تست بشه
۴. بعد از حدود ۵ دقیقه، workflow جدید تو تب Actions گیت‌هاب اجرا می‌شه — می‌تونی لاگش رو ببینی که چندتا سفارش چک کرده

## نکات مهم

- **پنجره‌ی زمانی هر سفارش ۴۵ دقیقه‌ست.** بعدش خودکار expired می‌شه.
- **بازبینی دستی (`review`)** فقط وقتی پیش میاد که یه خطای موقت (مثلاً قطعی API صرافی) رخ بده — این‌ها رو تو پنل ادمین چک کن.
- سیستم فعلی فقط برای TRC20 (USDT) و شبکه‌ی اصلی بیت‌کوین کار می‌کنه — نه ERC20، نه شبکه‌های دیگه.
