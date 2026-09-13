"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";

type SiteSettings = {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
};

type Plan = {
  id: string;
  name: string;
  price: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // App settings state
  const [appName, setAppName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planFeatures, setPlanFeatures] = useState("");
  const [planActive, setPlanActive] = useState(true);
  const [planSort, setPlanSort] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => {
        setIsAdmin(d.data?.isAdmin ?? false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchSettings();
    fetchPlans();
  }, [isAdmin]);

  async function fetchSettings() {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const d = await res.json();
      setAppName(d.data.appName);
      setLogoUrl(d.data.logoUrl);
      setFaviconUrl(d.data.faviconUrl);
    }
  }

  async function fetchPlans() {
    const res = await fetch("/api/plans?all=true");
    if (res.ok) {
      const d = await res.json();
      setPlans(d.data);
    }
  }

  async function handleUploadImage(
    file: File,
    setter: (url: string | null) => void,
    setUploading: (v: boolean) => void
  ) {
    setError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const d = await res.json();
        setter(d.data.url);
      } else {
        const d = await res.json();
        setError(d.error?.message || "Upload failed.");
      }
    } catch {
      setError("Upload failed.");
    }
    setUploading(false);
  }

  async function handleSaveSettings() {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName, logoUrl, faviconUrl }),
      });
      if (res.ok) setSuccess("Settings saved.");
      else {
        const d = await res.json();
        setError(d.error?.message || "Failed to save.");
      }
    } catch {
      setError("Failed to save.");
    }
    setSaving(false);
  }

  function openPlanForm(plan?: Plan) {
    if (plan) {
      setEditingPlan(plan);
      setPlanName(plan.name);
      setPlanPrice(plan.price);
      setPlanFeatures(plan.features.join("\n"));
      setPlanActive(plan.isActive);
      setPlanSort(plan.sortOrder);
    } else {
      setEditingPlan(null);
      setPlanName("");
      setPlanPrice("");
      setPlanFeatures("");
      setPlanActive(true);
      setPlanSort(plans.length);
    }
    setShowPlanForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSavePlan() {
    setError("");
    if (!planName || !planPrice) {
      setError("Plan name and price are required.");
      return;
    }
    const features = planFeatures.split("\n").map((f) => f.trim()).filter(Boolean);
    const body = {
      name: planName,
      price: planPrice,
      features,
      isActive: planActive,
      sortOrder: planSort,
    };

    try {
      const url = editingPlan ? `/api/plans/${editingPlan.id}` : "/api/plans";
      const method = editingPlan ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowPlanForm(false);
        setSuccess(editingPlan ? "Plan updated." : "Plan created.");
        fetchPlans();
      } else {
        const d = await res.json();
        setError(d.error?.message || "Failed to save plan.");
      }
    } catch {
      setError("Failed to save plan.");
    }
  }

  async function handleTogglePlan(plan: Plan) {
    await fetch(`/api/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !plan.isActive }),
    });
    fetchPlans();
  }

  async function handleDeletePlan(planId: string) {
    if (!confirm("Delete this plan?")) return;
    await fetch(`/api/plans/${planId}`, { method: "DELETE" });
    fetchPlans();
  }

  if (loading) return <p className="text-zinc-500">Loading...</p>;

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="max-w-lg space-y-6">
          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="text-lg font-semibold">Account</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-zinc-500">Name</label>
                <p className="font-medium">{session?.user?.name || "—"}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Email</label>
                <p className="font-medium">{session?.user?.email || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Settings</h1>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950 dark:text-green-400">
          {success}
        </div>
      )}

      {/* App Settings */}
      <div className="max-w-xl rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">App Settings</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">App Name</label>
            <input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Logo</label>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded object-cover" />
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadImage(file, setLogoUrl, setUploadingLogo);
                }}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {uploadingLogo ? "Uploading..." : "Upload"}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Favicon</label>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {faviconUrl && (
                <img src={faviconUrl} alt="Favicon" className="h-8 w-8 rounded object-cover" />
              )}
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadImage(file, setFaviconUrl, setUploadingFavicon);
                }}
              />
              <button
                type="button"
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploadingFavicon}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {uploadingFavicon ? "Uploading..." : "Upload"}
              </button>
              {faviconUrl && (
                <button
                  type="button"
                  onClick={() => setFaviconUrl(null)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Plans Management */}
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Plans</h2>
          <button
            onClick={() => openPlanForm()}
            className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
          >
            Add Plan
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 ${
                plan.isActive
                  ? "border-zinc-200 dark:border-zinc-800"
                  : "border-dashed border-zinc-300 opacity-60 dark:border-zinc-700"
              }`}
            >
              <div>
                <p className="font-medium">{plan.name}</p>
                <p className="text-sm text-zinc-500">{plan.price}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {plan.features.length} features
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTogglePlan(plan)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    plan.isActive
                      ? "bg-black dark:bg-white"
                      : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                  title={plan.isActive ? "Deactivate" : "Activate"}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform dark:bg-zinc-900 ${
                      plan.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <button
                  onClick={() => openPlanForm(plan)}
                  className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Form Modal */}
      {showPlanForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold">
              {editingPlan ? "Edit Plan" : "Add Plan"}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Price</label>
                <input
                  value={planPrice}
                  onChange={(e) => setPlanPrice(e.target.value)}
                  placeholder="$0/mo"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Features (one per line)
                </label>
                <textarea
                  value={planFeatures}
                  onChange={(e) => setPlanFeatures(e.target.value)}
                  rows={5}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Sort Order</label>
                <input
                  type="number"
                  value={planSort}
                  onChange={(e) => setPlanSort(Number(e.target.value))}
                  className="mt-1 block w-24 rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={planActive}
                  onChange={(e) => setPlanActive(e.target.checked)}
                />
                Active (visible on landing page)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowPlanForm(false)}
                className="rounded-md px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
              >
                {editingPlan ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
