"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

type CollectionRecord = {
  id: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = use(params);
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [jsonInput, setJsonInput] = useState("{}");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("");

  async function fetchRecords() {
    const res = await fetch(`/api/collections/${collectionId}/records`);
    if (res.ok) {
      const data = await res.json();
      setRecords(data.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchRecords();
  }, [collectionId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      const data = JSON.parse(jsonInput);
      const res = await fetch(`/api/collections/${collectionId}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (res.ok) {
        setJsonInput("{}");
        setShowAdd(false);
        fetchRecords();
      } else {
        const result = await res.json();
        setError(result.error?.message || "Failed to add record.");
      }
    } catch {
      setError("Invalid JSON.");
    }
    setAdding(false);
  }

  async function handleUpdate(recordId: string) {
    setError("");
    try {
      const data = JSON.parse(editJson);
      const res = await fetch(
        `/api/collections/${collectionId}/records/${recordId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        }
      );

      if (res.ok) {
        setEditingId(null);
        fetchRecords();
      } else {
        const result = await res.json();
        setError(result.error?.message || "Failed to update record.");
      }
    } catch {
      setError("Invalid JSON.");
    }
  }

  async function handleDelete(recordId: string) {
    if (!confirm("Delete this record?")) return;

    const res = await fetch(
      `/api/collections/${collectionId}/records/${recordId}`,
      { method: "DELETE" }
    );
    if (res.ok) fetchRecords();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/collections" className="text-sm text-zinc-500 hover:underline">
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold">Records</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="ml-auto rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
        >
          {showAdd ? "Cancel" : "Add Record"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">JSON Data</label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={6}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder='{"name": "John", "email": "john@example.com"}'
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {adding ? "Adding..." : "Add Record"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500">No records yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="mb-1 text-xs text-zinc-400">ID: {rec.id}</p>
                  {editingId === rec.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editJson}
                        onChange={(e) => setEditJson(e.target.value)}
                        rows={4}
                        className="block w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(rec.id)}
                          className="rounded bg-black px-3 py-1 text-xs text-white dark:bg-white dark:text-black"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded px-3 py-1 text-xs text-zinc-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <pre className="overflow-x-auto rounded bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                      {JSON.stringify(rec.data, null, 2)}
                    </pre>
                  )}
                </div>
                {editingId !== rec.id && (
                  <div className="ml-4 flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(rec.id);
                        setEditJson(JSON.stringify(rec.data, null, 2));
                      }}
                      className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
