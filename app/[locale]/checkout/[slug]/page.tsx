"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";

import { getTemplate } from "@/lib/data/get-template";
import { useAuth } from "@/lib/context/auth-context";
import { usePurchases } from "@/lib/context/purchases-context";
import Navbar from "@/components/navigation/navbar";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

const WALLETS = {
  USDT: {
    label: "USDT",
    network: "TRC20 (Tron network)",
    address: "TTs2YMrifwWhiEPWVxhqqHd7v5DZNu477R",
  },
  BTC: {
    label: "Bitcoin",
    network: "Bitcoin network",
    address: "bc1qky4uvdn0v9kyha9v9wns5893f62djd8ssa04u0",
  },
} as const;

type CurrencyKey = keyof typeof WALLETS;

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
  const params = useParams<{ slug: string }>();

  const template = getTemplate(params.slug);

  const { user, loading } = useAuth();

  const { hasPurchased, addPurchase } = usePurchases();

  const router = useRouter();

  const [copied, setCopied] = useState(false);

  const [confirming, setConfirming] = useState(false);

  const [currency, setCurrency] = useState<CurrencyKey>("USDT");

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/sign-in?next=/checkout/${params.slug}`);
    }
  }, [loading, user, router, params.slug]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060B18]">
        <p className="text-slate-500">
          {t("loading")}
        </p>
      </main>
    );
  }

  if (!template) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060B18]">
        <p className="text-slate-500">
          {t("templateNotFound")}
        </p>
      </main>
    );
  }

  const alreadyOwned = hasPurchased(template.slug);

  function handleCopy() {
    navigator.clipboard.writeText(WALLETS[currency].address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleConfirmPayment() {
    setConfirming(true);

    fetch("/api/notify-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateTitle: template!.title,
        templateSlug: template!.slug,
        price: template!.price,
        buyerName: user!.name,
        buyerEmail: user!.email,
        currency: WALLETS[currency].label,
      }),
    }).catch((error) => {
      // Never let a notification failure block the customer's flow.
      console.error("Failed to send purchase notification:", error);
    });

    setTimeout(() => {
      addPurchase({
        slug: template!.slug,
        title: template!.title,
        price: template!.price,
      });

      router.push("/dashboard");
    }, 1200);
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#060B18] px-6 pt-36 pb-20">

        <div className="mx-auto max-w-3xl">

          <h1 className="text-3xl font-black text-white">
            {t("title")}
          </h1>

          <p className="mt-2 text-slate-400">
            {t("unlockText")} {template.title}.
          </p>

          <Card className="mt-10 p-8 hover:-translate-y-0 hover:border-white/10">

            <div className="flex items-center justify-between border-b border-white/10 pb-6">

              <div>
                <p className="font-bold text-white">
                  {template.title}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {t("premiumLicense")}
                </p>
              </div>

              <p className="text-2xl font-black text-cyan-400">
                ${template.price}
              </p>

            </div>

            {alreadyOwned ? (
              <div className="mt-6 space-y-4 text-center">

                <p className="text-cyan-300">
                  {t("alreadyOwned")}
                </p>

                <Button onClick={() => router.push("/dashboard")}>
                  {t("goToDashboard")}
                </Button>

              </div>
            ) : (
              <div className="mt-6 space-y-6">

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {t("payWithCrypto")}
                  </p>

                  <div className="mt-4 flex gap-2">
                    {(Object.keys(WALLETS) as CurrencyKey[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => setCurrency(key)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          currency === key
                            ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                            : "border-white/10 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        {WALLETS[key].label}
                      </button>
                    ))}
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    {t("sendExactly")} <span className="font-bold text-white">${template.price}</span>{" "}
                    {t("worthOf")} {WALLETS[currency].label} ({WALLETS[currency].network}) {t("toWalletBelow")}
                  </p>

                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4">

                    <code className="flex-1 truncate text-sm text-slate-300">
                      {WALLETS[currency].address}
                    </code>

                    <button
                      onClick={handleCopy}
                      className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white transition hover:border-cyan-400"
                    >
                      {copied ? t("copied") : t("copy")}
                    </button>

                  </div>

                  <p className="mt-3 text-xs text-amber-400">
                    ⚠️ {t("networkWarning")} {WALLETS[currency].label} {t("networkWarningRest")}{" "}
                    {WALLETS[currency].network}. {t("networkWarningEnd")}
                  </p>
                </div>

                <p className="text-xs text-slate-500">
                  {t("noLiveVerification")}
                </p>

                <Button
                  className="w-full"
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                >
                  {confirming ? t("confirming") : t("completedPayment")}
                </Button>

              </div>
            )}

          </Card>

          <Link
            href={`/templates/${template.slug}`}
            className="mt-6 inline-block text-sm text-slate-400 hover:text-cyan-400"
          >
            {t("backToTemplate")}
          </Link>

        </div>

      </main>
    </>
  );
}
