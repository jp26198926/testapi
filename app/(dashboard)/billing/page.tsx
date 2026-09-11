"use client";

import { useState, useEffect } from "react";

type SubscriptionData = {
  plan: string;
  subscription: {
    id: string;
    status: string;
    plan: string;
    currentPeriodEnd: string | null;
    providerSubscriptionId: string | null;
  } | null;
};

export default function BillingPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((d) => {
        setData(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/subscriptions", { method: "POST" });
      const result = await res.json();
      if (result.data?.approvalUrl) {
        window.location.href = result.data.approvalUrl;
      }
    } catch {
      // noop
    }
    setUpgrading(false);
  }

  if (loading) return <p className="text-zinc-500">Loading...</p>;

  const plan = data?.plan || "free";
  const sub = data?.subscription;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Billing</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Plan */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Current Plan</h2>
          <p className="mt-2 text-3xl font-bold capitalize">{plan}</p>
          {sub && (
            <div className="mt-4 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <p>Status: {sub.status}</p>
              {sub.currentPeriodEnd && (
                <p>
                  Renews:{" "}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Plan Details */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Plan Limits</h2>
          {plan === "free" ? (
            <ul className="mt-4 space-y-2 text-sm">
              <li>Collections: 5 maximum</li>
              <li>Records: 50 per collection</li>
              <li>Rate limit: 120 requests/minute</li>
            </ul>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              <li>Collections: Unlimited</li>
              <li>Records: Unlimited</li>
              <li>Rate limit: 600 requests/minute</li>
            </ul>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <h3 className="text-lg font-bold">Free</h3>
          <p className="mt-1 text-2xl font-bold">$0/mo</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Public API access</li>
            <li>5 private collections</li>
            <li>50 records per collection</li>
            <li>CRUD API + playground</li>
            <li>API keys</li>
          </ul>
          {plan === "free" && (
            <div className="mt-4 rounded bg-zinc-100 px-3 py-2 text-center text-sm dark:bg-zinc-800">
              Current plan
            </div>
          )}
        </div>
        <div className="rounded-lg border border-black p-6 dark:border-white">
          <h3 className="text-lg font-bold">Pro</h3>
          <p className="mt-1 text-2xl font-bold">$9/mo</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Everything in Free</li>
            <li>Unlimited collections</li>
            <li>Unlimited records</li>
            <li>Higher rate limits</li>
            <li>Priority features</li>
          </ul>
          {plan === "pro" ? (
            <div className="mt-4 rounded bg-zinc-100 px-3 py-2 text-center text-sm dark:bg-zinc-800">
              Current plan
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="mt-4 w-full rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {upgrading ? "Redirecting to PayPal..." : "Upgrade to Pro"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
