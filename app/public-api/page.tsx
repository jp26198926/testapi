"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import Brand from "@/components/brand";

type PublicCollection = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
};

type PublicRecord = {
  id: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export default function PublicApiPage() {
  const { data: session } = useSession();
  const [collections, setCollections] = useState<PublicCollection[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [records, setRecords] = useState<PublicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [copied, setCopied] = useState<string | number | null>(null);
  const [appName, setAppName] = useState("TESTAPI");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.appName) setAppName(d.data.appName);
        if (d.data?.logoUrl) setLogoUrl(d.data.logoUrl);
      })
      .catch(() => {});
  }, []);

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
    fetch(`/api/public/${selected}?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        setRecords(d.data || []);
        setTotalPages(d.pagination?.totalPages || 1);
        setTotal(d.pagination?.total || 0);
        setRecordsLoading(false);
      })
      .catch(() => setRecordsLoading(false));
  }, [selected, page, limit]);

  function copyText(text: string, id: string | number) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="relative border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Brand
            appName={appName}
            logoUrl={logoUrl}
            textClassName="text-xl font-bold"
          />

          {/* Desktop nav */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/public-api"
              className="text-sm font-medium text-black dark:text-white"
            >
              Public API
            </Link>
            <Link
              href="/public-docs"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Docs
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Dashboard
              </Link>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 md:hidden"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="absolute left-0 right-0 top-full z-50 border-b border-zinc-200 bg-white px-6 py-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
              <div className="flex flex-col gap-3">
                <Link
                  href="/public-api"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-black dark:text-white"
                >
                  Public API
                </Link>
                <Link
                  href="/public-docs"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                >
                  Docs
                </Link>
                {session ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md bg-black px-4 py-2 text-center text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-md bg-black px-4 py-2 text-center text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Public API</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Explore our predefined collections. No authentication required —
            just start making requests.
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Quick Start</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <code className="min-w-0 flex-1 rounded bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900">
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
        <div className="mb-8">
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
          <div className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
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
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
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
        <div className="mb-8">
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
        {total > 0 && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm text-zinc-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)}{" "}
              of {total} records
            </p>
            <div className="flex items-center gap-3">
              <label className="text-sm text-zinc-500">
                Per page:
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="ml-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Prev
                </button>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
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
              href="/public-docs"
              className="rounded-md border border-zinc-300 px-6 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <p>&copy; {new Date().getFullYear()} {appName}. All rights reserved.</p>
      </footer>
    </div>
  );
}
