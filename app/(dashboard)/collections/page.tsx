"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  async function fetchCollections() {
    const res = await fetch("/api/collection");
    if (res.ok) {
      const data = await res.json();
      setCollections(data.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCollections();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const res = await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });

    if (res.ok) {
      setName("");
      setDescription("");
      setShowCreate(false);
      fetchCollections();
    } else {
      const data = await res.json();
      setError(data.error?.message || "Failed to create collection.");
    }
    setCreating(false);
  }

  async function handleDelete(id: string, collName: string) {
    if (!confirm(`Delete "${collName}" and all its records?`)) return;

    const res = await fetch(`/api/collection/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchCollections();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Collections</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {showCreate ? "Cancel" : "New Collection"}
        </button>
      </div>

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
            <label className="block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
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
      ) : collections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500">No collections yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 text-sm underline"
          >
            Create your first collection
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map((col) => (
            <div
              key={col.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div>
                <Link
                  href={`/collections/${col.id}`}
                  className="font-medium hover:underline"
                >
                  {col.name}
                </Link>
                <p className="text-sm text-zinc-500">
                  {col.description || "No description"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  /api/collection/{col.id}/{col.slug}
                </p>
              </div>
              <button
                onClick={() => handleDelete(col.id, col.name)}
                className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
