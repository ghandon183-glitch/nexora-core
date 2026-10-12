import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo/locale-alternates";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale, "/support") };
}

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
