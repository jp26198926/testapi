"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold">
            TESTAPI
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/public-api"
              className="text-sm font-medium text-black dark:text-white"
            >
              Public API
            </Link>
            <Link
              href="/docs"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Docs
            </Link>
            <Link
              href="/login"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Public API</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Explore our predefined collections. No authentication required — just
            start making requests.
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
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

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Collections sidebar */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Collections
            </h2>
            {loading ? (
              <p className="text-sm text-zinc-500">Loading...</p>
            ) : (
              <div className="space-y-1">
                {collections.map((col) => (
                  <button
                    key={col.slug}
                    onClick={() => {
                      setSelected(col.slug);
                      setPage(1);
                    }}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      selected === col.slug
                        ? "bg-zinc-200 font-medium dark:bg-zinc-800"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <span className="font-medium">{col.name}</span>
                    <span className="ml-2 text-xs text-zinc-400">
                      /api/public/{col.slug}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Records viewer */}
          <div>
            {selected && (
              <>
                {/* Endpoint info */}
                <div className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="mr-2 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                        GET
                      </span>
                      <code className="text-sm">
                        /api/public/{selected}
                      </code>
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

                {/* Records */}
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
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
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="rounded-md border border-zinc-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-zinc-700"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-bold">Want your own collections?</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Create a free account to build private collections with full CRUD
            operations.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/register"
              className="rounded-md bg-black px-6 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
            >
              Sign up free
            </Link>
            <Link
              href="/docs"
              className="rounded-md border border-zinc-300 px-6 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <p>&copy; {new Date().getFullYear()} TESTAPI. All rights reserved.</p>
      </footer>
    </div>
  );
}
