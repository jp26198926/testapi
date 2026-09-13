"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

type CollectionRecord = {
  id: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type FormField = { key: string; value: string };

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  PATCH: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  PUT: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={`inline-block w-16 rounded px-2 py-0.5 text-center text-xs font-bold ${METHOD_STYLES[method]}`}
    >
      {method}
    </span>
  );
}

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = use(params);
  const [slug, setSlug] = useState<string | null>(null);
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [inputMode, setInputMode] = useState<"form" | "json">("form");
  const [formFields, setFormFields] = useState<FormField[]>([
    { key: "", value: "" },
  ]);
  const [jsonInput, setJsonInput] = useState("{}");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showApiRef, setShowApiRef] = useState(false);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const base = slug ? `/api/collection/${collectionId}/${slug}` : null;

  const endpoints = base
    ? [
        {
          key: "list",
          method: "GET",
          path: base,
          desc: "List records (paginated)",
          reqBody: null,
          resBody: `{
  "data": [
    { "id": "...", "data": { ... }, "createdAt": "...", "updatedAt": "..." }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}`,
        },
        {
          key: "create",
          method: "POST",
          path: base,
          desc: "Create a record",
          reqBody: `{ "data": { "key": "value" } }`,
          resBody: `{
  "data": { "id": "...", "data": { "key": "value" }, "createdAt": "...", "updatedAt": "..." }
}`,
        },
        {
          key: "get",
          method: "GET",
          path: `${base}/{recordId}`,
          desc: "Get a single record",
          reqBody: null,
          resBody: `{
  "data": { "id": "...", "data": { ... }, "createdAt": "...", "updatedAt": "..." }
}`,
        },
        {
          key: "patch",
          method: "PATCH",
          path: `${base}/{recordId}`,
          desc: "Partial update (merges with existing data)",
          reqBody: `{ "data": { "field": "new value" } }`,
          resBody: `{
  "data": { "id": "...", "data": { ... }, "createdAt": "...", "updatedAt": "..." }
}`,
        },
        {
          key: "put",
          method: "PUT",
          path: `${base}/{recordId}`,
          desc: "Full replace (overwrites entire data)",
          reqBody: `{ "data": { "key": "value" } }`,
          resBody: `{
  "data": { "id": "...", "data": { "key": "value" }, "createdAt": "...", "updatedAt": "..." }
}`,
        },
        {
          key: "delete",
          method: "DELETE",
          path: `${base}/{recordId}`,
          desc: "Delete a record",
          reqBody: null,
          resBody: `204 No Content`,
        },
      ]
    : [];

  function copyUrl(url: string) {
    navigator.clipboard.writeText(window.location.origin + url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  async function fetchCollection() {
    const res = await fetch(`/api/collection/${collectionId}`);
    if (res.ok) {
      const data = await res.json();
      setSlug(data.data.slug);
    }
  }

  async function fetchRecords() {
    if (!slug) return;
    const res = await fetch(`/api/collection/${collectionId}/${slug}?page=${page}&limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      setRecords(data.data);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCollection();
  }, [collectionId]);

  useEffect(() => {
    if (slug) fetchRecords();
  }, [slug, page, limit]);

  function updateField(index: number, field: Partial<FormField>) {
    setFormFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...field } : f))
    );
  }

  function addField() {
    setFormFields((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeField(index: number) {
    setFormFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      let data: Record<string, unknown>;

      if (inputMode === "json") {
        data = JSON.parse(jsonInput);
      } else {
        data = {};
        let hasKey = false;
        for (const field of formFields) {
          const k = field.key.trim();
          if (!k) continue;
          hasKey = true;
          const v = field.value.trim();
          if (v === "true") data[k] = true;
          else if (v === "false") data[k] = false;
          else if (v !== "" && !isNaN(Number(v))) data[k] = Number(v);
          else data[k] = v;
        }
        if (!hasKey) {
          setError("Add at least one field with a name.");
          setAdding(false);
          return;
        }
      }

      const res = await fetch(`/api/collection/${collectionId}/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (res.ok) {
        setJsonInput("{}");
        setFormFields([{ key: "", value: "" }]);
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
        `/api/collection/${collectionId}/${slug}/${recordId}`,
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
      `/api/collection/${collectionId}/${slug}/${recordId}`,
      { method: "DELETE" }
    );
    if (res.ok) fetchRecords();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
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

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setInputMode("form")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                inputMode === "form"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => setInputMode("json")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                inputMode === "json"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              JSON
            </button>
          </div>

          {inputMode === "form" ? (
            <div className="space-y-2">
              {formFields.map((field, i) => (
                <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => updateField(i, { key: e.target.value })}
                    placeholder="field name"
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:w-1/3"
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateField(i, { value: e.target.value })}
                    placeholder="value"
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => removeField(i)}
                    disabled={formFields.length === 1}
                    className="rounded px-2 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-950"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addField}
                className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                + Add field
              </button>
            </div>
          ) : (
            <div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={6}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
                placeholder='{"name": "John", "email": "john@example.com"}'
              />
            </div>
          )}

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

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{" "}
            {total} records
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

      {/* API Reference */}
      {slug && (
        <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <button
            onClick={() => setShowApiRef(!showApiRef)}
            className="flex w-full items-center justify-between text-left"
          >
            <h2 className="text-lg font-semibold">API Reference</h2>
            <span className="text-sm text-zinc-500">
              {showApiRef ? "▲ Collapse" : "▼ Expand"}
            </span>
          </button>

          {showApiRef && (
            <div className="mt-4 space-y-3">
              {endpoints.map((ep) => (
                <div
                  key={ep.key}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setExpandedEndpoint(
                        expandedEndpoint === ep.key ? null : ep.key
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setExpandedEndpoint(
                          expandedEndpoint === ep.key ? null : ep.key
                        );
                    }}
                    className="flex w-full cursor-pointer flex-wrap items-center gap-2 p-3 text-left sm:gap-3"
                  >
                    <MethodBadge method={ep.method} />
                    <code className="min-w-0 flex-1 text-sm text-zinc-800 dark:text-zinc-200">
                      {ep.path}
                    </code>
                    <span className="hidden text-xs text-zinc-500 sm:inline">{ep.desc}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyUrl(ep.path);
                      }}
                      className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="Copy URL"
                    >
                      {copiedUrl === ep.path ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {expandedEndpoint === ep.key && (
                    <div className="space-y-3 border-t border-zinc-200 p-3 dark:border-zinc-800">
                      {ep.reqBody && (
                        <div>
                          <p className="mb-1 text-xs font-medium text-zinc-500">
                            Request Body
                          </p>
                          <pre className="overflow-x-auto rounded bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                            {ep.reqBody}
                          </pre>
                        </div>
                      )}
                      <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">
                          Response
                        </p>
                        <pre className="overflow-x-auto rounded bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                          {ep.resBody}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
