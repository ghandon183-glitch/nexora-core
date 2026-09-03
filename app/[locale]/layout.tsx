import type { Metadata } from "next";
import "./globals.css";

import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/lib/context/auth-context";
import { PurchasesProvider } from "@/lib/context/purchases-context";
import { getEnv } from "@/lib/env";

const FALLBACK_SITE_URL = "https://nexora-core.nxora.workers.dev";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const env = await getEnv();
  const siteUrl = env.SITE_URL || FALLBACK_SITE_URL;
  const canonicalPath = `/${locale}`;
  const languages: Record<string, string> = {};

  for (const language of routing.locales) {
    languages[language] = `${siteUrl}/${language}`;
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "Nexora Core | Premium Next.js Templates & UI Kit",
      template: "%s | Nexora Core",
    },
    description:
      "A growing collection of premium templates, dashboards, landing pages and reusable UI components for startups, SaaS products and modern web applications.",
    alternates: {
      canonical: canonicalPath,
      languages,
    },
    openGraph: {
      title: "Nexora Core | Premium Next.js Templates & UI Kit",
      description:
        "A growing collection of premium templates, dashboards, landing pages and reusable UI components for startups, SaaS products and modern web applications.",
      url: canonicalPath,
      siteName: "Nexora Core",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Nexora Core — Premium Next.js Templates & UI Kit",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Nexora Core | Premium Next.js Templates & UI Kit",
      description:
        "A growing collection of premium templates, dashboards, landing pages and reusable UI components for startups, SaaS products and modern web applications.",
      images: ["/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full overflow-x-hidden antialiased">
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <PurchasesProvider>{children}</PurchasesProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
