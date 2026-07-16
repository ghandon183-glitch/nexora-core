import type { Metadata } from "next";
import "./globals.css";

import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/lib/context/auth-context";
import { PurchasesProvider } from "@/lib/context/purchases-context";

export const metadata: Metadata = {
  title: "Nexora Core | Premium Next.js Templates & UI Kit",
  description: "A growing collection of premium templates, dashboards, landing pages and reusable UI components for startups, SaaS products and modern web applications.",
};

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
    <html
      lang={locale}
      className={`h-full overflow-x-hidden antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <PurchasesProvider>
              {children}
            </PurchasesProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
