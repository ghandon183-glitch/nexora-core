"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";

import { getTemplate } from "@/lib/data/get-template";
import { useAuth } from "@/lib/context/auth-context";
import { usePurchases } from "@/lib/context/purchases-context";
import Navbar from "@/components/navigation/navbar";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

type CurrencyKey = "USDT" | "BTC";

const CURRENCY_LABELS: Record<CurrencyKey, string> = {
  USDT: "USDT",
  BTC: "Bitcoin",
};

interface OrderState {
  id: string;
  payAmount: string;
  walletAddress: string;
  network: string;
  currency: CurrencyKey;
  expiresAt: number;
}

type OrderStatus = "idle" | "creating" | "waiting" | "confirmed" | "expired" | "error";

type EmailStep = "entry" | "sending" | "codeSent" | "verifying" | "verified";

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
  const params = useParams<{ slug: string }>();

  const template = getTemplate(params.slug);

  const { user, loading } = useAuth();
  const { hasPurchased, addPurchase } = usePurchases();
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [currency, setCurrency] = useState<CurrencyKey>("USDT");
  const [order, setOrder] = useState<OrderState | null>(null);
  const [status, setStatus] = useState<OrderStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Every download link goes to this email the moment payment is confirmed,
  // so it has to be re-verified at checkout — the account email typed at
  // sign-up isn't trusted to be real or to belong to whoever's buying now.
  const [emailStep, setEmailStep] = useState<EmailStep>("entry");
  const [emailInput, setEmailInput] = useState(user?.email ?? "");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/sign-in?next=/checkout/${params.slug}`);
    }
  }, [loading, user, router, params.slug]);

  // Poll order status every 8s while waiting for on-chain confirmation.
  useEffect(() => {
    if (status !== "waiting" || !order) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`);
        const data = (await res.json()) as {
          ok: boolean;
          status?: OrderStatus;
        };

        if (!data.ok) return;

        if (data.status === "confirmed") {
          setStatus("confirmed");
          addPurchase({
            slug: template!.slug,
            title: template!.title,
            price: template!.price,
          });
        } else if (data.status === "expired") {
          setStatus("expired");
        }
      } catch {
        // A single failed poll isn't fatal — it'll try again in 8s.
      }
    }, 8000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, order, addPurchase, template]);

  // Countdown timer display.
  useEffect(() => {
    if (status !== "waiting" || !order) return;

    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, order.expiresAt - Date.now());
      setTimeLeft(remaining);

      if (remaining <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status, order]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060B18]">
        <p className="text-slate-500">{t("loading")}</p>
      </main>
    );
  }

  if (!template) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060B18]">
        <p className="text-slate-500">{t("templateNotFound")}</p>
      </main>
    );
  }

  const alreadyOwned = hasPurchased(template.slug);

  function handleCopy() {
    if (!order) return;
    navigator.clipboard.writeText(order.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendCode() {
    const trimmedEmail = emailInput.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setVerifyError("Please enter a valid email address.");
      return;
    }

    setEmailStep("sending");
    setVerifyError(null);

    try {
      const res = await fetch("/api/verify-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string; verificationId?: string };

      if (!data.ok || !data.verificationId) {
        setVerifyError(data.error || "Could not send verification code. Please try again.");
        setEmailStep("entry");
        return;
      }

      setVerificationId(data.verificationId);
      setCodeInput("");
      setEmailStep("codeSent");
    } catch {
      setVerifyError("Network error. Please try again.");
      setEmailStep("entry");
    }
  }

  async function handleVerifyCode() {
    if (!verificationId) return;

    const trimmedCode = codeInput.trim();

    if (trimmedCode.length !== 6) {
      setVerifyError("Enter the 6-digit code from your email.");
      return;
    }

    setEmailStep("verifying");
    setVerifyError(null);

    try {
      const res = await fetch("/api/verify-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId, code: trimmedCode }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };

      if (!data.ok) {
        setVerifyError(data.error || "Incorrect code. Please try again.");
        setEmailStep("codeSent");
        return;
      }

      setEmailStep("verified");
    } catch {
      setVerifyError("Network error. Please try again.");
      setEmailStep("codeSent");
    }
  }

  function handleChangeEmail() {
    setEmailStep("entry");
    setVerificationId(null);
    setCodeInput("");
    setVerifyError(null);
  }

  async function handleCreateOrder() {
    if (emailStep !== "verified" || !verificationId) {
      setVerifyError("Please verify your email first.");
      return;
    }

    setStatus("creating");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateSlug: template!.slug,
          templateTitle: template!.title,
          basePriceUsd: template!.price,
          currency,
          buyerName: user!.name,
          buyerEmail: emailInput.trim(),
          verificationId,
        }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        order?: OrderState;
      };

      if (!data.ok || !data.order) {
        setErrorMessage(data.error || "Could not start checkout. Please try again.");
        setStatus("error");
        return;
      }

      setOrder(data.order);
      setStatus("waiting");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  function formatTimeLeft(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#060B18] px-6 pt-36 pb-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-black text-white">{t("title")}</h1>

          <p className="mt-2 text-slate-400">
            {t("unlockText")} {template.title}.
          </p>

          <Card className="mt-10 p-8 hover:-translate-y-0 hover:border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <p className="font-bold text-white">{template.title}</p>
                <p className="mt-1 text-sm text-slate-400">{t("premiumLicense")}</p>
              </div>
              <p className="text-2xl font-black text-cyan-400">${template.price}</p>
            </div>

            {alreadyOwned || status === "confirmed" ? (
              <div className="mt-6 space-y-4 text-center">
                <p className="text-cyan-300">
                  {status === "confirmed"
                    ? "Payment confirmed! Your download is ready."
                    : t("alreadyOwned")}
                </p>
                <Button onClick={() => router.push("/dashboard")}>{t("goToDashboard")}</Button>
              </div>
            ) : status === "idle" || status === "creating" || status === "error" ? (
              <div className="mt-6 space-y-6">
                {emailStep !== "verified" ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        Verify your email
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        Your download link goes here the moment payment is confirmed, so we need
                        to confirm you can actually receive email at this address.
                      </p>
                    </div>

                    {emailStep === "entry" || emailStep === "sending" ? (
                      <div className="space-y-3">
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="you@example.com"
                          disabled={emailStep === "sending"}
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                        />

                        {verifyError && <p className="text-sm text-red-400">{verifyError}</p>}

                        <Button
                          className="w-full"
                          onClick={handleSendCode}
                          disabled={emailStep === "sending"}
                        >
                          {emailStep === "sending" ? "Sending code..." : "Send verification code"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-400">
                          We sent a 6-digit code to{" "}
                          <span className="text-white">{emailInput.trim()}</span>.
                        </p>

                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={codeInput}
                          onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          disabled={emailStep === "verifying"}
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-center text-lg tracking-[0.4em] text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                        />

                        {verifyError && <p className="text-sm text-red-400">{verifyError}</p>}

                        <Button
                          className="w-full"
                          onClick={handleVerifyCode}
                          disabled={emailStep === "verifying"}
                        >
                          {emailStep === "verifying" ? "Verifying..." : "Verify code"}
                        </Button>

                        <div className="flex justify-between text-xs">
                          <button
                            onClick={handleChangeEmail}
                            className="text-slate-500 hover:text-cyan-400"
                          >
                            Use a different email
                          </button>
                          <button
                            onClick={handleSendCode}
                            className="text-slate-500 hover:text-cyan-400"
                          >
                            Resend code
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-300">
                      <span>✓</span>
                      <span>{emailInput.trim()} verified</span>
                      <button
                        onClick={handleChangeEmail}
                        className="ml-auto text-xs text-slate-500 hover:text-cyan-400"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        {t("payWithCrypto")}
                      </p>

                      <div className="mt-4 flex gap-2">
                        {(Object.keys(CURRENCY_LABELS) as CurrencyKey[]).map((key) => (
                          <button
                            key={key}
                            onClick={() => setCurrency(key)}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                              currency === key
                                ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                                : "border-white/10 text-slate-400 hover:border-white/20"
                            }`}
                          >
                            {CURRENCY_LABELS[key]}
                          </button>
                        ))}
                      </div>

                      <p className="mt-4 text-sm text-slate-400">
                        We&apos;ll generate a unique payment amount for your order so it can be
                        verified automatically on-chain — no manual review needed.
                      </p>
                    </div>

                    {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

                    <Button
                      className="w-full"
                      onClick={handleCreateOrder}
                      disabled={status === "creating"}
                    >
                      {status === "creating" ? t("confirming") : "Generate payment address"}
                    </Button>
                  </>
                )}
              </div>
            ) : status === "waiting" && order ? (
              <div className="mt-6 space-y-6">
                <p className="text-sm text-slate-400">
                  Send <span className="font-bold text-white">exactly</span> the amount below to
                  the wallet address — the exact amount matters, it&apos;s how we auto-detect your
                  payment.
                </p>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Amount to send
                  </p>
                  <p className="mt-1 text-2xl font-black text-cyan-300">
                    {order.payAmount} {order.currency}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{order.network}</p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
                  <code className="flex-1 truncate text-sm text-slate-300">
                    {order.walletAddress}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white transition hover:border-cyan-400"
                  >
                    {copied ? t("copied") : t("copy")}
                  </button>
                </div>

                <p className="text-xs text-amber-400">
                  ⚠️ Send only {CURRENCY_LABELS[order.currency]} on the {order.network}. Funds
                  sent on the wrong network cannot be recovered. Send the exact amount shown — a
                  rounded-off amount won&apos;t be detected automatically.
                </p>

                <div className="flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                  <p className="text-sm text-cyan-200">
                    Waiting for payment... checked automatically every few minutes. Time left:{" "}
                    {formatTimeLeft(timeLeft)}
                  </p>
                </div>

                <p className="text-xs text-slate-500">
                  You can safely close this page — we&apos;ll email {emailInput.trim()} the moment
                  your payment is confirmed.
                </p>
              </div>
            ) : status === "expired" ? (
              <div className="mt-6 space-y-4 text-center">
                <p className="text-amber-400">
                  This payment window expired without a matching transaction. No funds were
                  detected — please try again.
                </p>
                <Button
                  onClick={() => {
                    setOrder(null);
                    setStatus("idle");
                  }}
                >
                  Try again
                </Button>
              </div>
            ) : null}
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
