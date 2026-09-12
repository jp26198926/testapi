"use client";

import { useState, useEffect } from "react";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function fetchKeys() {
    const res = await fetch("/api/keys");
    if (res.ok) {
      const data = await res.json();
      setKeys(data.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchKeys();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      const data = await res.json();
      setNewKey(data.data.key);
      setName("");
      setShowCreate(false);
      fetchKeys();
    } else {
      const data = await res.json();
      setError(data.error?.message || "Failed to create key.");
    }
    setCreating(false);
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;

    const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
    if (res.ok) fetchKeys();
  }

  async function handleCopy(id: string) {
    const res = await fetch(`/api/keys/${id}/reveal`);
    if (!res.ok) return;
    const data = await res.json();
    await navigator.clipboard.writeText(data.data.key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
        >
          {showCreate ? "Cancel" : "Create Key"}
        </button>
      </div>

      {newKey && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Your new API key (save it — it won&apos;t be shown again):
          </p>
          <code className="mt-2 block break-all rounded bg-green-100 p-2 text-sm dark:bg-green-900">
            {newKey}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(newKey);
            }}
            className="mt-2 text-sm underline"
          >
            Copy to clipboard
          </button>
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">Key Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. My Development Key"
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : keys.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500">No API keys yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className={`rounded-lg border p-4 ${
                key.revokedAt
                  ? "border-zinc-200 opacity-50 dark:border-zinc-800"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{key.name}</p>
                  <p className="font-mono text-sm text-zinc-500">
                    {key.keyPrefix}...
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt &&
                      ` | Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    {key.expiresAt &&
                      ` | Expires: ${new Date(key.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {key.revokedAt ? (
                    <span className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-500 dark:bg-zinc-800">
                      Revoked
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleCopy(key.id)}
                        className="rounded px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        {copiedId === key.id ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={() => handleRevoke(key.id)}
                        className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        Revoke
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
