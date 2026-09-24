"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

interface AdminOrder {
  id: string;
  template_title: string;
  base_price_usd: number;
  currency: "USDT" | "BTC";
  pay_amount: string;
  buyer_name: string;
  buyer_email: string;
  status: "pending" | "confirmed" | "expired" | "review";
  tx_hash: string | null;
  created_at: number;
  confirmed_at: number | null;
}

interface PaymegateWebhookStatus {
  providerStatus?: number;
  configuredUrl?: string | null;
  expectedUrl?: string;
  providerReturnedSecret?: boolean;
  signingSecret?: string | null;
  localSecretConfigured?: boolean;
  message?: string | null;
  error?: string;
}

const STATUS_STYLES: Record<AdminOrder["status"], string> = {
  pending: "bg-amber-400/10 text-amber-300 border-amber-400/30",
  confirmed: "bg-cyan-400/10 text-cyan-300 border-cyan-400/30",
  expired: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  review: "bg-red-400/10 text-red-300 border-red-400/30",
};

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [filter, setFilter] = useState<"all" | AdminOrder["status"]>("all");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [webhook, setWebhook] = useState<PaymegateWebhookStatus | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);

  async function fetchOrders() {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = (await res.json()) as { ok: boolean; orders?: AdminOrder[] };
      if (data.ok && data.orders) {
        setOrders(data.orders);
        setAuthenticated(true);
      }
    } finally {
      setLoadingOrders(false);
    }
  }

  async function fetchWebhookStatus() {
    setWebhookError(null);
    try {
      const res = await fetch("/api/admin/paymegate/webhook", { cache: "no-store" });
      const data = (await res.json()) as PaymegateWebhookStatus & { ok?: boolean };
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      setWebhook(data);
      if (!res.ok) {
        setWebhookError(data.error || data.message || "Could not read Paymegate webhook status.");
      }
    } catch {
      setWebhookError("Could not read Paymegate webhook status.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fetch on mount to check existing session, not a synchronization loop
    fetchOrders();
  }, []);

  async function handleLogin() {
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (data.ok) {
      setAuthenticated(true);
      fetchOrders();
    } else {
      setLoginError(data.error || "Incorrect password");
    }
  }

  async function handleForceConfirm(id: string) {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/confirm`, { method: "POST" });
      const data = (await res.json()) as { ok: boolean; [key: string]: unknown };
      if (data.ok) {
        fetchOrders();
      }
    } finally {
      setConfirmingId(null);
    }
  }

  async function handlePaymegateSetup() {
    setWebhookLoading(true);
    setWebhookError(null);
    try {
      const res = await fetch("/api/admin/paymegate/webhook", { method: "POST" });
      const data = (await res.json()) as PaymegateWebhookStatus & { ok?: boolean };
      setWebhook(data);
      if (!res.ok) {
        setWebhookError(data.error || data.message || "Paymegate webhook setup failed.");
      }
    } catch {
      setWebhookError("Could not reach Paymegate webhook setup.");
    } finally {
      setWebhookLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060B18] px-6">
        <Card className="w-full max-w-sm p-8 hover:-translate-y-0 hover:border-white/10">
          <h1 className="text-xl font-bold text-white">Admin Login</h1>
          <div className="mt-6 space-y-4">
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            {loginError && <p className="text-sm text-red-400">{loginError}</p>}
            <Button className="w-full" onClick={handleLogin}>
              Sign in
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const counts = {
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    expired: orders.filter((o) => o.status === "expired").length,
    review: orders.filter((o) => o.status === "review").length,
  };

  return (
    <main className="min-h-screen bg-[#060B18] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white">Orders</h1>
          <Button onClick={fetchOrders} disabled={loadingOrders}>
            {loadingOrders ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <Card className="mt-8 p-6 hover:-translate-y-0 hover:border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Paymegate webhook</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Connect the signed Paymegate payment callback to NEXORA. This uses your
                server-side Paymegate API key; the API key is never sent to the browser.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Webhook URL: <code className="text-slate-300">https://nexora-core.nxora.workers.dev/api/paymegate/webhook</code>
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchWebhookStatus} disabled={webhookLoading}>
                Check status
              </Button>
              <Button onClick={handlePaymegateSetup} disabled={webhookLoading}>
                {webhookLoading ? "Connecting..." : "Connect / refresh"}
              </Button>
            </div>
          </div>

          {webhookError && (
            <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">
              {webhookError}
            </p>
          )}

          {webhook && (
            <div className="mt-5 space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm">
              <p className="text-slate-300">
                Provider status: <span className="font-semibold text-white">{webhook.providerStatus ?? "—"}</span>
              </p>
              <p className="text-slate-300">
                Provider URL: <span className="font-mono text-xs text-slate-400">{webhook.configuredUrl || "Not reported"}</span>
              </p>
              <p className="text-slate-300">
                Local signing secret:{" "}
                <span className={webhook.localSecretConfigured ? "text-cyan-300" : "text-amber-300"}>
                  {webhook.localSecretConfigured ? "configured" : "missing in Cloudflare"}
                </span>
              </p>

              {webhook.providerReturnedSecret && webhook.signingSecret && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-4">
                  <p className="font-semibold text-amber-200">One-time signing secret</p>
                  <p className="mt-1 text-xs leading-5 text-amber-100/70">
                    Copy this value into Cloudflare Production as <code>PAYMEGATE_WEBHOOK_SECRET</code>.
                    Never send it in chat or commit it to GitHub.
                  </p>
                  <div className="mt-3 break-all rounded-md bg-black/30 p-3 font-mono text-xs text-white">
                    {webhook.signingSecret}
                  </div>
                </div>
              )}

              {!webhook.providerReturnedSecret && !webhook.localSecretConfigured && (
                <p className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100/80">
                  Paymegate did not return a signing secret from this request. Check the
                  Paymegate Merchant Webhooks page for a one-time secret field or use
                  Connect / refresh after saving the webhook URL there.
                </p>
              )}
            </div>
          )}
        </Card>

        <div className="mt-6 flex flex-wrap gap-2">
          {(["all", "pending", "review", "confirmed", "expired"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                filter === key
                  ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                  : "border-white/10 text-slate-400 hover:border-white/20"
              }`}
            >
              {key === "all" ? `All (${orders.length})` : `${key} (${counts[key]})`}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {filteredOrders.length === 0 && (
            <p className="text-sm text-slate-500">No orders in this view.</p>
          )}

          {filteredOrders.map((order) => (
            <Card key={order.id} className="p-5 hover:-translate-y-0 hover:border-white/10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-white">{order.template_title}</p>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {order.buyer_name} · {order.buyer_email}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.pay_amount} {order.currency} (base ${order.base_price_usd})
                  </p>
                  {order.tx_hash && (
                    <p className="mt-1 truncate text-xs text-slate-600">tx: {order.tx_hash}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-600">
                    Created {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>

                {(order.status === "pending" || order.status === "review") && (
                  <Button
                    onClick={() => handleForceConfirm(order.id)}
                    disabled={confirmingId === order.id}
                  >
                    {confirmingId === order.id ? "Confirming..." : "Force confirm"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
