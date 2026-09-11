"use client";

import { useState, useEffect } from "react";

type PublicCollection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
};

type PublicRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export default function PublicApiPage() {
  const [collections, setCollections] = useState<PublicCollection[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [records, setRecords] = useState<PublicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public")
      .then((r) => r.json())
      .then((d) => {
        setCollections(d.data || []);
        if (d.data?.length > 0) setSelected(d.data[0].slug);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setRecordsLoading(true);
    fetch(`/api/public/${selected}?page=${page}&limit=10`)
      .then((r) => r.json())
      .then((d) => {
        setRecords(d.data || []);
        setTotalPages(d.pagination?.totalPages || 1);
        setRecordsLoading(false);
      })
      .catch(() => setRecordsLoading(false));
  }, [selected, page]);

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Public API</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Explore predefined collections — no authentication required.
        </p>
      </div>

      {/* Quick Start */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Quick Start</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900">
              curl {baseUrl}/api/public/posts
            </code>
            <button
              onClick={() =>
                copyText(`curl ${baseUrl}/api/public/posts`, "quickstart")
              }
              className="rounded px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {copied === "quickstart" ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-sm text-zinc-500">
            Returns a paginated list of records from the Posts collection.
          </p>
        </div>
      </div>

      {/* Collection Selector */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Collections
        </h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {collections.map((col) => (
              <button
                key={col.slug}
                onClick={() => {
                  setSelected(col.slug);
                  setPage(1);
                }}
                className={`rounded-md px-4 py-2 text-sm ${
                  selected === col.slug
                    ? "bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Endpoint info */}
      {selected && (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="mr-2 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                GET
              </span>
              <code className="text-sm">/api/public/{selected}</code>
            </div>
            <button
              onClick={() =>
                copyText(
                  `curl ${baseUrl}/api/public/${selected}`,
                  "endpoint"
                )
              }
              className="rounded px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {copied === "endpoint" ? "Copied!" : "Copy cURL"}
            </button>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-zinc-500">
            <span>
              Pagination:{" "}
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">
                ?page=1&limit=20
              </code>
            </span>
            <span>Max limit: 100</span>
          </div>
        </div>
      )}

      {/* Records */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Response Preview
        </h2>
        {recordsLoading ? (
          <p className="text-sm text-zinc-500">Loading records...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-zinc-500">No records found.</p>
        ) : (
          <div className="space-y-3">
            {records.map((rec) => {
              const { id, createdAt, updatedAt, ...fields } = rec;
              return (
                <div
                  key={id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-400">
                      ID: {id}
                    </span>
                    <button
                      onClick={() =>
                        copyText(
                          `curl ${baseUrl}/api/public/${selected}/${id}`,
                          id
                        )
                      }
                      className="text-xs text-zinc-500 hover:underline"
                    >
                      {copied === id ? "Copied!" : "Copy URL"}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded bg-zinc-50 p-3 text-sm dark:bg-zinc-950">
                    {JSON.stringify(fields, null, 2)}
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
