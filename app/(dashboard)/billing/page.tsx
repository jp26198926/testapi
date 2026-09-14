"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-table";
import {
  exportToCSV,
  exportToExcel,
  type ExportColumn,
} from "@/lib/export";

type Plan = {
  id: string;
  name: string;
  price: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
};

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

type SubscriptionRecord = {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
};

type PaymentRecord = {
  id: string;
  amount: string;
  currency: string;
  status: string;
  description: string | null;
  providerPaymentId: string | null;
  createdAt: string;
};

const subscriptionColumns: DataTableColumn<SubscriptionRecord>[] = [
  {
    key: "createdAt",
    label: "Date",
    render: (val) => new Date(val as string).toLocaleDateString(),
  },
  { key: "plan", label: "Plan", render: (val) => <span className="capitalize">{String(val)}</span> },
  {
    key: "status",
    label: "Status",
    render: (val) => {
      const status = String(val);
      const colors: Record<string, string> = {
        active: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
        cancelled: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        suspended: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
        expired: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      };
      return (
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors[status] || ""}`}>
          {status}
        </span>
      );
    },
  },
  {
    key: "currentPeriodEnd",
    label: "Period End",
    render: (val) => (val ? new Date(val as string).toLocaleDateString() : "-"),
  },
];

const subscriptionExportColumns: ExportColumn[] = [
  { key: "createdAt", label: "Date" },
  { key: "plan", label: "Plan" },
  { key: "status", label: "Status" },
  { key: "currentPeriodStart", label: "Period Start" },
  { key: "currentPeriodEnd", label: "Period End" },
];

const paymentColumns: DataTableColumn<PaymentRecord>[] = [
  {
    key: "createdAt",
    label: "Date",
    render: (val) => new Date(val as string).toLocaleDateString(),
  },
  {
    key: "amount",
    label: "Amount",
    render: (val, row) => `${row.currency} ${val}`,
  },
  {
    key: "status",
    label: "Status",
    render: (val) => {
      const status = String(val);
      const colors: Record<string, string> = {
        completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
        denied: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
        refunded: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
      };
      return (
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors[status] || ""}`}>
          {status}
        </span>
      );
    },
  },
  { key: "description", label: "Description" },
];

const paymentExportColumns: ExportColumn[] = [
  { key: "createdAt", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "currency", label: "Currency" },
  { key: "status", label: "Status" },
  { key: "description", label: "Description" },
  { key: "providerPaymentId", label: "Payment ID" },
];

export default function BillingPage() {
  // Subscription state
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [banner, setBanner] = useState<null | "success" | "cancelled">(null);
  const [upgradeError, setUpgradeError] = useState("");

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);

  // Billing records state
  const [billingRecords, setBillingRecords] = useState<SubscriptionRecord[]>([]);
  const [billingPage, setBillingPage] = useState(1);
  const [billingLimit, setBillingLimit] = useState(10);
  const [billingTotal, setBillingTotal] = useState(0);
  const [billingTotalPages, setBillingTotalPages] = useState(0);
  const [billingLoading, setBillingLoading] = useState(true);

  // Payment records state
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentLimit, setPaymentLimit] = useState(10);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [paymentTotalPages, setPaymentTotalPages] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(true);

  const refetchSubscription = useCallback(() => {
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") setBanner("success");
    else if (params.get("cancelled") === "true") setBanner("cancelled");
    if (params.has("success") || params.has("cancelled")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((d) => {
        setData(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => setAdmin(d.data?.isAdmin ?? false))
      .catch(() => {});

    fetch("/api/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.data || []))
      .catch(() => {});
  }, []);

  // Poll briefly after PayPal return — webhook may lag the redirect
  useEffect(() => {
    if (banner !== "success") return;
    const timers = [2000, 5000, 10000].map((ms) =>
      setTimeout(refetchSubscription, ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [banner, refetchSubscription]);

  const fetchBillingRecords = useCallback(() => {
    setBillingLoading(true);
    fetch(`/api/subscriptions/history?page=${billingPage}&limit=${billingLimit}`)
      .then((r) => r.json())
      .then((d) => {
        setBillingRecords(d.data || []);
        if (d.pagination) {
          setBillingTotal(d.pagination.total);
          setBillingTotalPages(d.pagination.totalPages);
        }
        setBillingLoading(false);
      })
      .catch(() => setBillingLoading(false));
  }, [billingPage, billingLimit]);

  const fetchPaymentRecords = useCallback(() => {
    setPaymentLoading(true);
    fetch(`/api/payments?page=${paymentPage}&limit=${paymentLimit}`)
      .then((r) => r.json())
      .then((d) => {
        setPaymentRecords(d.data || []);
        if (d.pagination) {
          setPaymentTotal(d.pagination.total);
          setPaymentTotalPages(d.pagination.totalPages);
        }
        setPaymentLoading(false);
      })
      .catch(() => setPaymentLoading(false));
  }, [paymentPage, paymentLimit]);

  useEffect(() => {
    fetchBillingRecords();
  }, [fetchBillingRecords]);

  useEffect(() => {
    fetchPaymentRecords();
  }, [fetchPaymentRecords]);

  async function handleUpgrade(planLocalId?: string) {
    setUpgrading(true);
    setUpgradeError("");
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planLocalId ? { planId: planLocalId } : {}),
      });
      const result = await res.json();
      if (!res.ok || result.error?.message) {
        setUpgradeError(
          result.error?.message || "Upgrade failed. Please try again."
        );
        return;
      }
      if (result.data?.approvalUrl) {
        window.location.href = result.data.approvalUrl;
        return;
      }
      setUpgradeError(
        "PayPal did not return an approval URL. Check server logs and PayPal plan configuration."
      );
    } catch {
      setUpgradeError("Network error while starting upgrade.");
    } finally {
      setUpgrading(false);
    }
  }

  async function handleCancel() {
    if (
      !confirm(
        "Cancel your Pro subscription? You keep Pro until the period ends."
      )
    ) {
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      if (res.ok) {
        refetchSubscription();
        fetchBillingRecords();
      }
    } finally {
      setCancelling(false);
    }
  }

  async function handleExportBilling(format: "csv" | "excel") {
    const res = await fetch(`/api/subscriptions/history?page=1&limit=10000`);
    const d = await res.json();
    const rows = d.data || [];
    if (format === "csv") {
      exportToCSV(subscriptionExportColumns, rows, "billing-records.csv");
    } else {
      exportToExcel(subscriptionExportColumns, rows, "billing-records.xlsx");
    }
  }

  async function handleExportPayments(format: "csv" | "excel") {
    const res = await fetch(`/api/payments?page=1&limit=10000`);
    const d = await res.json();
    const rows = d.data || [];
    if (format === "csv") {
      exportToCSV(paymentExportColumns, rows, "payment-records.csv");
    } else {
      exportToExcel(paymentExportColumns, rows, "payment-records.xlsx");
    }
  }

  if (loading) return <p className="text-zinc-500">Loading...</p>;

  const plan = admin ? "admin" : data?.plan || "free";
  const sub = data?.subscription;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Billing</h1>

      {banner === "success" && (
        <div className="flex items-start justify-between rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          <span>
            {sub?.status === "pending"
              ? "Payment received. Activating your Pro subscription…"
              : "Payment successful. Your Pro subscription is active."}
          </span>
          <button
            onClick={() => setBanner(null)}
            className="ml-4 shrink-0 underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {banner === "cancelled" && (
        <div className="flex items-start justify-between rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <span>Checkout was cancelled. You have not been charged.</span>
          <button
            onClick={() => setBanner(null)}
            className="ml-4 shrink-0 underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {upgradeError && (
        <div className="flex items-start justify-between rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <span>{upgradeError}</span>
          <button
            onClick={() => setUpgradeError("")}
            className="ml-4 shrink-0 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Current Plan</h2>
          <p className="mt-2 text-3xl font-bold capitalize">{plan}</p>
          {sub && (
            <div className="mt-4 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <p>Status: {sub.status}</p>
              {sub.status === "pending" && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  Awaiting PayPal approval
                </p>
              )}
              {sub.currentPeriodEnd && (
                <p>
                  Renews:{" "}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
          {plan === "pro" && sub?.status === "active" && !admin && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              {cancelling ? "Cancelling..." : "Cancel subscription"}
            </button>
          )}
        </div>

        {/* Plan Limits */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Plan Limits</h2>
          {admin ? (
            <ul className="mt-4 space-y-2 text-sm">
              <li>Collections: Unlimited</li>
              <li>Records: Unlimited</li>
              <li>Rate limit: Unlimited</li>
            </ul>
          ) : plan === "free" ? (
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

      {/* Plans (dynamic from DB, only active) — hidden for admin */}
      {!admin && plans.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((p) => {
            const isCurrent =
              p.name.toLowerCase() === plan.toLowerCase();
            return (
              <div
                key={p.id}
                className={`rounded-lg border p-6 ${
                  isCurrent
                    ? "border-black dark:border-white"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="mt-1 text-2xl font-bold">{p.price}</p>
                {Array.isArray(p.features) && p.features.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {p.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
                {isCurrent ? (
                  <div className="mt-4 rounded bg-zinc-100 px-3 py-2 text-center text-sm dark:bg-zinc-800">
                    Current plan
                  </div>
                ) : sub?.status === "pending" ? (
                  <div className="mt-4 rounded bg-yellow-100 px-3 py-2 text-center text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                    Awaiting PayPal approval
                  </div>
                ) : p.name.toLowerCase() === "pro" && plan === "free" ? (
                  <button
                    onClick={() => handleUpgrade(p.id)}
                    disabled={upgrading}
                    className="mt-4 w-full rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black"
                  >
                    {upgrading
                      ? "Redirecting to PayPal..."
                      : "Upgrade to Pro"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Billing Records */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Billing Records</h2>
        <DataTable
          columns={subscriptionColumns}
          data={billingRecords}
          page={billingPage}
          limit={billingLimit}
          total={billingTotal}
          totalPages={billingTotalPages}
          onPageChange={setBillingPage}
          onLimitChange={(l) => {
            setBillingLimit(l);
            setBillingPage(1);
          }}
          onExportCSV={() => handleExportBilling("csv")}
          onExportExcel={() => handleExportBilling("excel")}
          loading={billingLoading}
        />
      </div>

      {/* Payment Records */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Payment Records</h2>
        <DataTable
          columns={paymentColumns}
          data={paymentRecords}
          page={paymentPage}
          limit={paymentLimit}
          total={paymentTotal}
          totalPages={paymentTotalPages}
          onPageChange={setPaymentPage}
          onLimitChange={(l) => {
            setPaymentLimit(l);
            setPaymentPage(1);
          }}
          onExportCSV={() => handleExportPayments("csv")}
          onExportExcel={() => handleExportPayments("excel")}
          loading={paymentLoading}
        />
      </div>
    </div>
  );
}
