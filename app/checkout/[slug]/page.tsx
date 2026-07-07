"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import { getTemplate } from "@/lib/data/get-template";
import { useAuth } from "@/lib/context/auth-context";
import { usePurchases } from "@/lib/context/purchases-context";
import Navbar from "@/components/navigation/navbar";
import FloatingDock from "@/components/navigation/floating-dock";
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
          Loading...
        </p>
      </main>
    );
  }

  if (!template) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060B18]">
        <p className="text-slate-500">
          Template not found.
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
      <FloatingDock />

      <main className="min-h-screen bg-[#060B18] px-6 pt-36 pb-20">

        <div className="mx-auto max-w-3xl">

          <h1 className="text-3xl font-black text-white">
            Checkout
          </h1>

          <p className="mt-2 text-slate-400">
            Complete your purchase to unlock {template.title}.
          </p>

          <Card className="mt-10 p-8 hover:-translate-y-0 hover:border-white/10">

            <div className="flex items-center justify-between border-b border-white/10 pb-6">

              <div>
                <p className="font-bold text-white">
                  {template.title}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Premium license · lifetime updates
                </p>
              </div>

              <p className="text-2xl font-black text-cyan-400">
                ${template.price}
              </p>

            </div>

            {alreadyOwned ? (
              <div className="mt-6 space-y-4 text-center">

                <p className="text-cyan-300">
                  You already own this template.
                </p>

                <Button onClick={() => router.push("/dashboard")}>
                  Go to Dashboard
                </Button>

              </div>
            ) : (
              <div className="mt-6 space-y-6">

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Pay with crypto
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
                    Send exactly <span className="font-bold text-white">${template.price}</span>{" "}
                    worth of {WALLETS[currency].label} ({WALLETS[currency].network}) to the
                    wallet address below, then confirm your payment. Orders
                    are verified manually and unlocked shortly after
                    confirmation.
                  </p>

                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4">

                    <code className="flex-1 truncate text-sm text-slate-300">
                      {WALLETS[currency].address}
                    </code>

                    <button
                      onClick={handleCopy}
                      className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white transition hover:border-cyan-400"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>

                  </div>

                  <p className="mt-3 text-xs text-amber-400">
                    ⚠️ Only send {WALLETS[currency].label} on the{" "}
                    {WALLETS[currency].network}. Funds sent on the wrong
                    network cannot be recovered.
                  </p>
                </div>

                <p className="text-xs text-slate-500">
                  There is no live payment verification connected yet — this
                  button simulates confirmation for demo purposes.
                </p>

                <Button
                  className="w-full"
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                >
                  {confirming ? "Confirming..." : "I've completed the payment"}
                </Button>

              </div>
            )}

          </Card>

          <Link
            href={`/templates/${template.slug}`}
            className="mt-6 inline-block text-sm text-slate-400 hover:text-cyan-400"
          >
            ← Back to template
          </Link>

        </div>

      </main>
    </>
  );
}
